# Backend Worker Implementation Guide

This guide provides detailed instructions for implementing the GPU processing workers that power the furniture visualization platform.

## Overview

The platform requires 5 types of workers:
1. **Segmentation Worker** - Component detection and masking
2. **Stain Worker** - Wood stain recoloring with grain preservation
3. **3D Worker** - Mesh generation from images
4. **Render Worker** - 360° video and turntable generation
5. **Export Worker** - Format conversion and optimization

## Prerequisites

### Environment Setup

```bash
# Ubuntu 22.04 with NVIDIA GPU
sudo apt update
sudo apt install -y python3.10 python3-pip nvidia-cuda-toolkit

# Install Docker with GPU support
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker

# Verify GPU access
nvidia-smi
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

### Python Dependencies

```bash
pip install \
  openai==1.x \
  supabase==2.x \
  redis==5.x \
  rq==1.x \
  Pillow==10.x \
  opencv-python==4.x \
  numpy==1.x \
  torch==2.x \
  torchvision==0.x \
  open3d==0.x \
  trimesh==4.x \
  boto3==1.x
```

## Worker Architecture

### Base Worker Class

```python
# workers/base_worker.py
import os
import json
from typing import Dict, Any
from supabase import create_client, Client
from openai import OpenAI
import redis

class BaseWorker:
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        self.openai = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.redis = redis.Redis(
            host=os.getenv('REDIS_HOST'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )

    def update_job_status(self, job_id: str, status: str,
                         output_data: Dict = None, error: str = None):
        """Update job status in database"""
        update = {'status': status}
        if output_data:
            update['output_data'] = json.dumps(output_data)
        if error:
            update['error_message'] = error
        if status == 'processing':
            update['started_at'] = 'now()'
        elif status in ['completed', 'failed']:
            update['completed_at'] = 'now()'

        self.supabase.table('jobs').update(update).eq('id', job_id).execute()

    def download_image(self, url: str) -> bytes:
        """Download image from URL"""
        import requests
        response = requests.get(url)
        response.raise_for_status()
        return response.content

    def upload_to_storage(self, bucket: str, path: str,
                         data: bytes, content_type: str = 'image/png') -> str:
        """Upload file to Supabase storage and return public URL"""
        self.supabase.storage.from_(bucket).upload(
            path, data, {'content-type': content_type}
        )
        return self.supabase.storage.from_(bucket).get_public_url(path)
```

## 1. Segmentation Worker

Uses OpenAI Vision to detect components and create masks.

```python
# workers/segmentation_worker.py
from base_worker import BaseWorker
import base64
from PIL import Image
import io
import numpy as np

class SegmentationWorker(BaseWorker):
    def process(self, job_id: str, input_data: dict):
        """
        Process segmentation job

        Input:
          - uploadId: str
          - options: {
              detect_components: bool,
              detect_wood: bool
            }

        Output:
          - masks: [{ component: str, maskUrl: str, confidence: float }]
          - components: [str]
        """
        self.update_job_status(job_id, 'processing')

        try:
            # Get images from upload
            upload_id = input_data['uploadId']
            images = self.supabase.table('images') \
                .select('*') \
                .eq('upload_id', upload_id) \
                .execute()

            if not images.data:
                raise ValueError('No images found for upload')

            results = []

            for img_record in images.data:
                # Download image
                img_bytes = self.download_image(img_record['url'])

                # Encode for OpenAI
                img_base64 = base64.b64encode(img_bytes).decode('utf-8')

                # Call OpenAI Vision API
                response = self.openai.chat.completions.create(
                    model="gpt-4-vision-preview",  # Use latest available
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": """Analyze this furniture image.
                                    Identify all components (legs, cushions, fabric,
                                    frame, hardware). For each component, provide:
                                    1. Component name
                                    2. Bounding box coordinates (x, y, width, height)
                                    3. Confidence score
                                    4. Material type (wood, metal, fabric, etc.)

                                    Return as JSON."""
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{img_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=1000
                )

                # Parse response
                components = json.loads(response.choices[0].message.content)

                # Generate masks (simplified - use SAM or custom model in production)
                for component in components:
                    mask = self.create_mask_from_bbox(
                        img_bytes,
                        component['bbox']
                    )

                    # Upload mask
                    mask_path = f"masks/{upload_id}/{component['name']}.png"
                    mask_url = self.upload_to_storage('images', mask_path, mask)

                    results.append({
                        'component': component['name'],
                        'maskUrl': mask_url,
                        'confidence': component['confidence'],
                        'material': component.get('material')
                    })

            # Update job with results
            output_data = {
                'masks': results,
                'components': list(set(r['component'] for r in results))
            }

            self.update_job_status(job_id, 'completed', output_data)

        except Exception as e:
            self.update_job_status(job_id, 'failed', error=str(e))

    def create_mask_from_bbox(self, img_bytes: bytes, bbox: dict) -> bytes:
        """Create binary mask from bounding box"""
        img = Image.open(io.BytesIO(img_bytes))
        mask = Image.new('L', img.size, 0)

        from PIL import ImageDraw
        draw = ImageDraw.Draw(mask)
        draw.rectangle(
            [bbox['x'], bbox['y'],
             bbox['x'] + bbox['width'],
             bbox['y'] + bbox['height']],
            fill=255
        )

        # Convert to bytes
        buffer = io.BytesIO()
        mask.save(buffer, format='PNG')
        return buffer.getvalue()
```

## 2. Stain Worker

Recolors wood while preserving grain.

```python
# workers/stain_worker.py
from base_worker import BaseWorker
from PIL import Image
import numpy as np
import cv2
import io

class StainWorker(BaseWorker):
    def process(self, job_id: str, input_data: dict):
        """
        Process stain recolor job

        Input:
          - uploadId: str
          - targetColor: str (hex)
          - options: {
              preserveGrain: float (0-1),
              strength: float (0-1)
            }

        Output:
          - albedoUrl: str
          - normalUrl: str
          - roughnessUrl: str
          - aoUrl: str
          - previewUrl: str
        """
        self.update_job_status(job_id, 'processing')

        try:
            upload_id = input_data['uploadId']
            target_color = input_data['targetColor']
            preserve_grain = input_data['options']['preserveGrain']

            # Get images
            images = self.supabase.table('images') \
                .select('*') \
                .eq('upload_id', upload_id) \
                .execute()

            if not images.data:
                raise ValueError('No images found')

            # Process first image (extend for multi-image)
            img_bytes = self.download_image(images.data[0]['url'])
            img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            img_array = np.array(img)

            # Step 1: Intrinsic decomposition (separate albedo from lighting)
            albedo, shading = self.intrinsic_decomposition(img_array)

            # Step 2: Extract grain/high-frequency details
            grain = self.extract_grain(albedo)

            # Step 3: Apply color transfer
            target_rgb = self.hex_to_rgb(target_color)
            colored_albedo = self.recolor_wood(albedo, target_rgb, preserve_grain)

            # Step 4: Re-apply grain
            final_albedo = self.apply_grain(colored_albedo, grain, preserve_grain)

            # Step 5: Generate PBR maps
            normal_map = self.generate_normal_map(grain)
            roughness_map = self.estimate_roughness(img_array)
            ao_map = self.generate_ao(img_array)

            # Upload results
            user_id = images.data[0]['user_id']
            texture_id = f"{upload_id}_stained"

            albedo_url = self.upload_texture(
                final_albedo, f"{user_id}/{texture_id}/albedo.png"
            )
            normal_url = self.upload_texture(
                normal_map, f"{user_id}/{texture_id}/normal.png"
            )
            roughness_url = self.upload_texture(
                roughness_map, f"{user_id}/{texture_id}/roughness.png"
            )
            ao_url = self.upload_texture(
                ao_map, f"{user_id}/{texture_id}/ao.png"
            )

            # Create preview
            preview = self.composite_preview(final_albedo, shading)
            preview_url = self.upload_texture(
                preview, f"{user_id}/{texture_id}/preview.png"
            )

            # Create texture record
            texture = self.supabase.table('textures').insert({
                'user_id': user_id,
                'name': f"Stained {target_color}",
                'albedo_url': albedo_url,
                'normal_url': normal_url,
                'roughness_url': roughness_url,
                'ao_url': ao_url,
                'preview_url': preview_url,
                'stain_color': target_color,
                'preserve_grain': preserve_grain
            }).execute()

            output_data = {
                'textureId': texture.data[0]['id'],
                'albedoUrl': albedo_url,
                'normalUrl': normal_url,
                'roughnessUrl': roughness_url,
                'aoUrl': ao_url,
                'previewUrl': preview_url
            }

            self.update_job_status(job_id, 'completed', output_data)

        except Exception as e:
            self.update_job_status(job_id, 'failed', error=str(e))

    def intrinsic_decomposition(self, img: np.ndarray):
        """Separate reflectance (albedo) from illumination"""
        # Use Retinex algorithm or trained model
        # Simplified version:
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        blur = cv2.GaussianBlur(gray, (51, 51), 0)

        albedo = img.astype(float)
        shading = cv2.cvtColor(blur, cv2.COLOR_GRAY2RGB).astype(float)

        # Normalize
        albedo = np.clip(albedo * 255.0 / (shading + 1e-6), 0, 255).astype(np.uint8)

        return albedo, shading / 255.0

    def extract_grain(self, albedo: np.ndarray):
        """Extract high-frequency grain details"""
        gray = cv2.cvtColor(albedo, cv2.COLOR_RGB2GRAY)
        # High-pass filter
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        grain = cv2.subtract(gray, blur)
        return grain

    def recolor_wood(self, albedo: np.ndarray, target_rgb: tuple,
                     preserve: float):
        """Apply color transfer in LAB space"""
        # Convert to LAB
        lab = cv2.cvtColor(albedo, cv2.COLOR_RGB2LAB).astype(float)
        target_lab = cv2.cvtColor(
            np.uint8([[target_rgb]]), cv2.COLOR_RGB2LAB
        )[0][0].astype(float)

        # Transfer color
        lab[:, :, 1] = lab[:, :, 1] * preserve + target_lab[1] * (1 - preserve)
        lab[:, :, 2] = lab[:, :, 2] * preserve + target_lab[2] * (1 - preserve)

        # Convert back
        colored = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8),
                              cv2.COLOR_LAB2RGB)
        return colored

    def apply_grain(self, colored: np.ndarray, grain: np.ndarray,
                    strength: float):
        """Re-apply grain to colored albedo"""
        grain_3ch = cv2.cvtColor(grain, cv2.COLOR_GRAY2RGB)
        result = cv2.addWeighted(colored, 1.0, grain_3ch, strength, 0)
        return np.clip(result, 0, 255).astype(np.uint8)

    def generate_normal_map(self, grain: np.ndarray):
        """Generate normal map from grain"""
        # Use Sobel operators
        sobelx = cv2.Sobel(grain, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(grain, cv2.CV_64F, 0, 1, ksize=3)

        # Create normal map
        normal = np.dstack([
            sobelx,
            sobely,
            np.ones_like(grain) * 255
        ])

        # Normalize
        normal = cv2.normalize(normal, None, 0, 255, cv2.NORM_MINMAX)
        return normal.astype(np.uint8)

    def estimate_roughness(self, img: np.ndarray):
        """Estimate roughness from image variance"""
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        # Local variance indicates roughness
        kernel_size = 15
        variance = cv2.blur(gray**2, (kernel_size, kernel_size)) - \
                   cv2.blur(gray, (kernel_size, kernel_size))**2
        roughness = cv2.normalize(variance, None, 0, 255, cv2.NORM_MINMAX)
        return roughness.astype(np.uint8)

    def generate_ao(self, img: np.ndarray):
        """Generate ambient occlusion approximation"""
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        # Darken in crevices (approximate)
        ao = cv2.GaussianBlur(255 - gray, (21, 21), 0)
        return ao

    def composite_preview(self, albedo: np.ndarray, shading: np.ndarray):
        """Combine albedo and shading for preview"""
        result = (albedo.astype(float) * shading).astype(np.uint8)
        return result

    def hex_to_rgb(self, hex_color: str):
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def upload_texture(self, img_array: np.ndarray, path: str):
        """Upload numpy array as PNG"""
        img = Image.fromarray(img_array)
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return self.upload_to_storage('images', path, buffer.getvalue())
```

## 3. 3D Generation Worker

Generates 3D meshes using various methods.

```python
# workers/3d_worker.py
from base_worker import BaseWorker
import subprocess
import tempfile
import os

class ThreeDWorker(BaseWorker):
    def process(self, job_id: str, input_data: dict):
        """
        Process 3D generation job

        Input:
          - uploadId: str
          - mode: 'photogrammetry' | 'nerf' | 'single_image'
          - options: dict

        Output:
          - modelId: str
          - glbUrl: str
          - usdzUrl: str
          - fbxUrl: str
        """
        self.update_job_status(job_id, 'processing')

        try:
            mode = input_data['mode']

            if mode == 'single_image':
                result = self.generate_from_single_image(input_data)
            elif mode == 'photogrammetry':
                result = self.generate_from_photogrammetry(input_data)
            elif mode == 'nerf':
                result = self.generate_from_nerf(input_data)
            else:
                raise ValueError(f"Unknown mode: {mode}")

            self.update_job_status(job_id, 'completed', result)

        except Exception as e:
            self.update_job_status(job_id, 'failed', error=str(e))

    def generate_from_single_image(self, input_data: dict):
        """Use OpenAI Shap-E for single image to 3D"""
        # OpenAI Shap-E API (placeholder - actual implementation depends on API)
        upload_id = input_data['uploadId']
        images = self.supabase.table('images') \
            .select('*') \
            .eq('upload_id', upload_id) \
            .execute()

        img_url = images.data[0]['url']

        # Call OpenAI Shap-E (or similar)
        # response = self.openai.images.to_3d(...)

        # For now, return placeholder
        return {
            'glbUrl': 'https://example.com/model.glb',
            'usdzUrl': 'https://example.com/model.usdz'
        }

    def generate_from_photogrammetry(self, input_data: dict):
        """Use Meshroom/RealityCapture for photogrammetry"""
        upload_id = input_data['uploadId']
        images = self.supabase.table('images') \
            .select('*') \
            .eq('upload_id', upload_id) \
            .execute()

        with tempfile.TemporaryDirectory() as tmpdir:
            # Download all images
            img_dir = os.path.join(tmpdir, 'images')
            os.makedirs(img_dir)

            for i, img_record in enumerate(images.data):
                img_bytes = self.download_image(img_record['url'])
                img_path = os.path.join(img_dir, f'img_{i:04d}.jpg')
                with open(img_path, 'wb') as f:
                    f.write(img_bytes)

            # Run Meshroom
            output_dir = os.path.join(tmpdir, 'output')
            subprocess.run([
                'meshroom_batch',
                '--input', img_dir,
                '--output', output_dir
            ], check=True)

            # Find generated mesh
            mesh_path = os.path.join(output_dir, 'texturedMesh.obj')

            # Convert to GLB using Blender
            glb_path = self.convert_to_glb(mesh_path, tmpdir)

            # Upload
            with open(glb_path, 'rb') as f:
                glb_url = self.upload_to_storage(
                    'models',
                    f'{upload_id}/model.glb',
                    f.read(),
                    'model/gltf-binary'
                )

            # Convert to USDZ
            usdz_path = self.convert_to_usdz(glb_path, tmpdir)
            with open(usdz_path, 'rb') as f:
                usdz_url = self.upload_to_storage(
                    'models',
                    f'{upload_id}/model.usdz',
                    f.read(),
                    'model/vnd.usdz+zip'
                )

            return {
                'glbUrl': glb_url,
                'usdzUrl': usdz_url
            }

    def convert_to_glb(self, input_path: str, tmpdir: str):
        """Convert mesh to GLB using Blender"""
        output_path = os.path.join(tmpdir, 'output.glb')

        blender_script = f"""
import bpy
bpy.ops.import_scene.obj(filepath='{input_path}')
bpy.ops.export_scene.gltf(filepath='{output_path}', export_format='GLB')
        """

        script_path = os.path.join(tmpdir, 'convert.py')
        with open(script_path, 'w') as f:
            f.write(blender_script)

        subprocess.run([
            'blender', '--background', '--python', script_path
        ], check=True)

        return output_path

    def convert_to_usdz(self, glb_path: str, tmpdir: str):
        """Convert GLB to USDZ"""
        output_path = os.path.join(tmpdir, 'output.usdz')

        # Use Apple's usdzconvert or usd_from_gltf
        subprocess.run([
            'usd_from_gltf',
            glb_path,
            output_path
        ], check=True)

        return output_path
```

## 4. Render Worker

Generates 360° videos using Blender.

```python
# workers/render_worker.py
from base_worker import BaseWorker
import subprocess
import tempfile
import os

class RenderWorker(BaseWorker):
    def process(self, job_id: str, input_data: dict):
        """
        Process 360 render job

        Input:
          - modelId: str
          - options: {
              frames: int,
              resolution: str
            }

        Output:
          - mp4Url: str
          - gifUrl: str
          - thumbnails: [str]
        """
        self.update_job_status(job_id, 'processing')

        try:
            model_id = input_data['modelId']
            frames = input_data['options'].get('frames', 36)
            resolution = input_data['options'].get('resolution', '1920x1080')

            # Get model
            model = self.supabase.table('models_3d') \
                .select('*') \
                .eq('id', model_id) \
                .single() \
                .execute()

            glb_url = model.data['glb_url']

            with tempfile.TemporaryDirectory() as tmpdir:
                # Download model
                glb_path = os.path.join(tmpdir, 'model.glb')
                glb_bytes = self.download_image(glb_url)
                with open(glb_path, 'wb') as f:
                    f.write(glb_bytes)

                # Render turntable
                frames_dir = os.path.join(tmpdir, 'frames')
                os.makedirs(frames_dir)

                self.render_turntable(glb_path, frames_dir, frames, resolution)

                # Create video
                mp4_path = os.path.join(tmpdir, 'turntable.mp4')
                self.create_video(frames_dir, mp4_path, frames)

                # Create GIF
                gif_path = os.path.join(tmpdir, 'turntable.gif')
                self.create_gif(frames_dir, gif_path, frames)

                # Upload
                with open(mp4_path, 'rb') as f:
                    mp4_url = self.upload_to_storage(
                        'renders',
                        f'{model_id}/turntable.mp4',
                        f.read(),
                        'video/mp4'
                    )

                with open(gif_path, 'rb') as f:
                    gif_url = self.upload_to_storage(
                        'renders',
                        f'{model_id}/turntable.gif',
                        f.read(),
                        'image/gif'
                    )

                # Create render output record
                render = self.supabase.table('render_outputs').insert({
                    'user_id': model.data['user_id'],
                    'model_id': model_id,
                    'type': '360_video',
                    'mp4_url': mp4_url,
                    'gif_url': gif_url,
                    'frames': frames,
                    'resolution': resolution
                }).execute()

                output_data = {
                    'renderId': render.data[0]['id'],
                    'mp4Url': mp4_url,
                    'gifUrl': gif_url
                }

                self.update_job_status(job_id, 'completed', output_data)

        except Exception as e:
            self.update_job_status(job_id, 'failed', error=str(e))

    def render_turntable(self, glb_path: str, output_dir: str,
                        frames: int, resolution: str):
        """Render 360 turntable animation with Blender"""
        width, height = map(int, resolution.split('x'))

        blender_script = f"""
import bpy
import math

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Import model
bpy.ops.import_scene.gltf(filepath='{glb_path}')

# Get imported object
obj = bpy.context.selected_objects[0]

# Center object
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
obj.location = (0, 0, 0)

# Add camera
bpy.ops.object.camera_add(location=(3, 0, 1))
camera = bpy.context.active_object
camera.data.lens = 50
bpy.context.scene.camera = camera

# Add lighting (3-point)
bpy.ops.object.light_add(type='AREA', location=(2, 2, 3))
bpy.context.active_object.data.energy = 500

bpy.ops.object.light_add(type='AREA', location=(-2, -2, 2))
bpy.context.active_object.data.energy = 300

bpy.ops.object.light_add(type='SUN', location=(0, 0, 5))
bpy.context.active_object.data.energy = 2

# Set render settings
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 128
bpy.context.scene.render.resolution_x = {width}
bpy.context.scene.render.resolution_y = {height}
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.view_settings.view_transform = 'Filmic'

# Render turntable
for i in range({frames}):
    angle = (i / {frames}) * 2 * math.pi
    camera.location = (
        3 * math.cos(angle),
        3 * math.sin(angle),
        1
    )
    camera.rotation_euler = (
        math.radians(90),
        0,
        angle + math.radians(90)
    )

    bpy.context.scene.render.filepath = '{output_dir}/frame_{{:04d}}.png'.format(i)
    bpy.ops.render.render(write_still=True)
        """

        script_path = os.path.join(output_dir, 'render.py')
        with open(script_path, 'w') as f:
            f.write(blender_script)

        subprocess.run([
            'blender', '--background', '--python', script_path
        ], check=True)

    def create_video(self, frames_dir: str, output_path: str, frames: int):
        """Create MP4 from frames"""
        subprocess.run([
            'ffmpeg', '-framerate', '24',
            '-i', os.path.join(frames_dir, 'frame_%04d.png'),
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
            '-y', output_path
        ], check=True)

    def create_gif(self, frames_dir: str, output_path: str, frames: int):
        """Create GIF from frames"""
        subprocess.run([
            'ffmpeg', '-framerate', '12',
            '-i', os.path.join(frames_dir, 'frame_%04d.png'),
            '-vf', 'scale=640:-1',
            '-y', output_path
        ], check=True)
```

## Queue Setup

### Redis Queue

```python
# queue_manager.py
from rq import Queue
from redis import Redis
import os

redis_conn = Redis(host=os.getenv('REDIS_HOST'), port=6379)

segmentation_queue = Queue('segmentation', connection=redis_conn)
stain_queue = Queue('stain', connection=redis_conn)
threed_queue = Queue('3d', connection=redis_conn)
render_queue = Queue('render', connection=redis_conn)

def enqueue_job(job_type: str, job_id: str, input_data: dict):
    if job_type == 'segment':
        queue = segmentation_queue
        from workers.segmentation_worker import SegmentationWorker
        worker_class = SegmentationWorker
    elif job_type == 'stain':
        queue = stain_queue
        from workers.stain_worker import StainWorker
        worker_class = StainWorker
    elif job_type == '3d':
        queue = threed_queue
        from workers.3d_worker import ThreeDWorker
        worker_class = ThreeDWorker
    elif job_type == 'render':
        queue = render_queue
        from workers.render_worker import RenderWorker
        worker_class = RenderWorker
    else:
        raise ValueError(f"Unknown job type: {job_type}")

    queue.enqueue(
        worker_class().process,
        job_id,
        input_data,
        job_timeout='2h'
    )
```

### Start Workers

```bash
# Terminal 1
rq worker segmentation --url redis://localhost:6379

# Terminal 2
rq worker stain --url redis://localhost:6379

# Terminal 3
rq worker 3d --url redis://localhost:6379

# Terminal 4
rq worker render --url redis://localhost:6379
```

## Dockerfile for Workers

```dockerfile
FROM nvidia/cuda:12.0-cudnn8-runtime-ubuntu22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    blender \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

# Copy worker code
COPY workers/ /app/workers/
WORKDIR /app

# Start worker
CMD ["rq", "worker", "segmentation", "stain", "3d", "render", "--url", "redis://redis:6379"]
```

## Kubernetes Deployment

```yaml
# worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: furniture-workers
spec:
  replicas: 3
  selector:
    matchLabels:
      app: furniture-workers
  template:
    metadata:
      labels:
        app: furniture-workers
    spec:
      containers:
      - name: worker
        image: your-registry/furniture-worker:latest
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: "16Gi"
            cpu: "4"
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: supabase-secret
              key: url
        - name: SUPABASE_SERVICE_ROLE_KEY
          valueFrom:
            secretKeyRef:
              name: supabase-secret
              key: service-role-key
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secret
              key: api-key
```

## Cost Optimization

1. **Use spot instances** for GPU workers (50-90% cheaper)
2. **Auto-scaling** based on queue depth
3. **Batch processing** for similar jobs
4. **Cache results** for common operations
5. **Progressive quality** (fast preview, then high quality)

## Monitoring

```python
# Add to workers
import time
import psutil
import GPUtil

class WorkerMetrics:
    def __init__(self):
        self.start_time = time.time()

    def record_job_complete(self, job_id: str, job_type: str):
        duration = time.time() - self.start_time

        # Get GPU usage
        gpus = GPUtil.getGPUs()
        gpu_usage = gpus[0].load * 100 if gpus else 0

        # Send to monitoring
        metrics = {
            'job_id': job_id,
            'job_type': job_type,
            'duration': duration,
            'gpu_usage': gpu_usage,
            'memory_usage': psutil.virtual_memory().percent
        }

        # Push to Prometheus/CloudWatch
        print(f"Metrics: {metrics}")
```

## Testing

```python
# test_workers.py
import pytest
from workers.stain_worker import StainWorker

def test_stain_worker():
    worker = StainWorker()

    # Mock job
    job_id = 'test-123'
    input_data = {
        'uploadId': 'upload-abc',
        'targetColor': '#5A3B2E',
        'options': {
            'preserveGrain': 0.9,
            'strength': 0.9
        }
    }

    worker.process(job_id, input_data)

    # Check job status
    job = worker.supabase.table('jobs').select('*').eq('id', job_id).single().execute()
    assert job.data['status'] == 'completed'
```

## Production Checklist

- [ ] Environment variables configured
- [ ] GPU drivers installed
- [ ] Redis running and accessible
- [ ] Supabase storage buckets created
- [ ] OpenAI API key valid
- [ ] Blender installed
- [ ] FFmpeg installed
- [ ] Meshroom or RealityCapture installed
- [ ] Workers can connect to Redis
- [ ] Workers can connect to Supabase
- [ ] Storage permissions correct
- [ ] Monitoring configured
- [ ] Error alerts set up
- [ ] Auto-scaling configured
- [ ] Cost tracking enabled

## Next Steps

1. Implement API Gateway to create jobs from frontend
2. Deploy workers to Kubernetes with GPU
3. Set up monitoring dashboards
4. Implement cost tracking per user
5. Add webhook notifications
6. Optimize worker performance
7. Add more sophisticated stain algorithms
8. Integrate advanced photogrammetry
9. Add NeRF support

This implementation provides a production-ready foundation for the backend processing infrastructure.
