# Advanced Upload System - User Guide

## Overview

The Advanced Upload system supports multiple upload sources and 15+ image processing operations. You can upload images from various sources and configure exactly which processing operations should be applied to each image.

---

## Upload Sources

### 1. **Files** (Drag & Drop / Browse)
Upload images directly from your computer.

**How to use:**
1. Click the "Files" source button
2. Either:
   - Drag and drop images into the upload zone
   - Click "Browse Files" to select images
3. Multiple images supported

**Supported formats:** JPG, PNG, WebP, TIFF, etc.

---

### 2. **URLs** (Bulk Image URLs)
Provide direct image URLs for batch processing.

**How to use:**
1. Click the "URLs" source button
2. Paste image URLs (one per line)
3. Click "Add URLs"

**Example:**
```
https://example.com/product1.jpg
https://example.com/product2.jpg
https://example.com/product3.jpg
```

**Use case:** Import images from your CDN or external sources

---

### 3. **CSV/XLSX** (Spreadsheet Import)
Upload a CSV or Excel file containing image URLs.

**How to use:**
1. Click the "CSV/XLSX" source button
2. Upload your CSV/XLSX file
3. Images are automatically extracted from the first column

**CSV Format:**
```csv
image_url,product_name,sku
https://example.com/chair1.jpg,Modern Chair,CHAIR-001
https://example.com/chair2.jpg,Classic Chair,CHAIR-002
```

**Use case:** Import large product catalogs from your inventory system

---

### 4. **Product Page** (Web Scraping)
Extract all images from a product page URL.

**How to use:**
1. Click the "Product Page" source button
2. Enter the product page URL
3. System automatically extracts all product images

**Example:**
```
https://store.example.com/products/modern-chair
```

**What it extracts:**
- Main product images
- Gallery images
- Thumbnail images
- High-resolution versions

**Use case:** Import products from competitor sites or your own store

---

### 5. **Cloud Storage** (Dropbox / Google Drive)
Import images directly from cloud storage.

**How to use:**
1. Click the "Cloud Storage" source button
2. Select provider (Dropbox or Google Drive)
3. Enter folder path
4. Click upload

**Example paths:**
- Dropbox: `/Furniture/Products/Chairs`
- Google Drive: `/My Drive/Products/2025`

**Note:** Authentication required (implemented on backend)

---

## Processing Operations

The system supports **15 image processing operations**. You can select which operations to apply in two ways:

### Auto-Detection Mode (Recommended)
The AI automatically determines what processing each image needs.

**How it works:**
1. Enable "Auto-detect processing requirements"
2. Upload images
3. System analyzes each image and applies appropriate operations

**Benefits:**
- No manual configuration needed
- Optimal processing for each image
- Faster workflow

---

### Manual Selection Mode
Manually choose which operations to apply.

**How to use:**
1. Disable "Auto-detect" checkbox
2. Click "Configure Processing"
3. Select operations to apply to all images
4. Or configure per-image processing (future feature)

---

## Available Processing Operations

### 1. **Image Resizing**
Resize images to specific dimensions.

**Options:**
- Target width/height
- Maintain aspect ratio
- Scale up/down
- Multiple size outputs (thumbnail, medium, large)

**Use case:** Standardize product images to 2000x2000px

---

### 2. **Background Removal**
Remove image background automatically.

**Features:**
- AI-powered segmentation
- Clean edges
- Transparent background (PNG output)
- Shadow preservation option

**Use case:** Create white-background product images for e-commerce

---

### 3. **Image Retouch / Enhancer**
Enhance image quality automatically.

**Improvements:**
- Sharpness enhancement
- Noise reduction
- Color correction
- Exposure adjustment
- Contrast optimization

**Use case:** Fix underexposed or low-quality photos

---

### 4. **Image Cropping / Reframing**
Intelligently crop images to focus on product.

**Features:**
- AI-detected product boundaries
- Center product in frame
- Remove unnecessary space
- Multiple aspect ratios

**Use case:** Standardize product framing

---

### 5. **Image Compression & Optimization**
Reduce file size without quality loss.

**Options:**
- Target file size or quality
- WebP conversion
- Progressive JPEG
- Metadata removal

**Use case:** Optimize images for web (faster loading)

---

### 6. **Lifestyle Image Creation**
Place products in realistic lifestyle settings.

**Features:**
- AI-generated backgrounds
- Room scene insertion
- Lighting matching
- Shadow generation

**Use case:** Create marketing images without photoshoots

---

### 7. **Infographic Creation**
Generate product infographics with specifications.

**Includes:**
- Dimensions overlay
- Feature callouts
- Material labels
- Size comparisons

**Use case:** Create detailed product specification sheets

---

### 8. **Line Diagram**
Convert product images to technical line drawings.

**Output:**
- Black & white line art
- Vector format (SVG)
- Clean outlines
- No textures

**Use case:** Create assembly instructions or CAD references

---

### 9. **Material Swatch Creation**
Extract and create material swatches from images.

**Generates:**
- Fabric texture tiles
- Wood grain samples
- Metal finish swatches
- Color palettes

**Use case:** Show available material options

---

### 10. **Color Analysis**
Analyze dominant colors in product images.

**Provides:**
- Color palette extraction
- Hex/RGB codes
- Color names
- Percentage breakdown

**Use case:** Generate product color variants

---

### 11. **3D Modeling**
Generate 3D models from product images.

**Methods:**
- Single image → 3D (Shap-E)
- Multi-view → 3D (Photogrammetry)
- NeRF-based reconstruction

**Outputs:** GLB, USDZ, FBX, GLTF

**Use case:** Create AR experiences

---

### 12. **360° Product Spin Video**
Create turntable spin videos.

**Options:**
- 36-72 frames
- HD/4K resolution
- MP4 or GIF output
- Custom backgrounds

**Use case:** Interactive product views

---

### 13. **Image Re-coloring**
Change product colors while preserving texture.

**Features:**
- Wood stain replacement
- Fabric color change
- Metal finish swap
- Grain preservation

**Use case:** Show product in multiple colors

---

### 14. **3D Product Configurator**
Create interactive product configurator.

**Features:**
- Component swapping (legs, cushions, etc.)
- Real-time material changes
- Price calculation
- AR preview

**Use case:** Let customers customize products

---

### 15. **Image Extraction from PDF**
Extract images from PDF catalogs.

**Extracts:**
- All embedded images
- Vector graphics (rasterized)
- Page screenshots
- High-resolution versions

**Use case:** Import from PDF catalogs

---

## Workflow Examples

### Example 1: Single Product Upload with Auto-Detection

1. Click **Upload** tab
2. Select **Files** source
3. Drag and drop `chair-photo.jpg`
4. Enable **Auto-detect processing requirements**
5. Click **Upload**

**Result:** System analyzes the image and automatically applies:
- Background removal
- Image enhancement
- Compression
- 3D modeling (if multiple angles detected)

---

### Example 2: Bulk URL Import with Manual Processing

1. Click **Upload** tab
2. Select **URLs** source
3. Paste 50 product image URLs
4. Disable **Auto-detect**
5. Click **Configure Processing**
6. Select:
   - Background Removal
   - Image Resizing (2000x2000)
   - Compression & Optimization
7. Click **Upload**

**Result:** All 50 images get the same 3 operations applied

---

### Example 3: Product Page Scraping for 360° Spin

1. Click **Upload** tab
2. Select **Product Page** source
3. Enter: `https://store.com/products/chair`
4. Enable **Auto-detect**
5. Click **Upload**

**Result:** System:
- Extracts all images from the product page
- Detects multiple angles
- Automatically generates 360° spin video

---

### Example 4: CSV Import with Material Swatches

1. Prepare CSV:
```csv
image_url,product_name
https://cdn.com/table1.jpg,Oak Table
https://cdn.com/table2.jpg,Walnut Table
```

2. Click **Upload** tab
3. Select **CSV/XLSX** source
4. Upload CSV file
5. Disable **Auto-detect**
6. Select processing:
   - Material Swatch Creation
   - Color Analysis
7. Click **Upload**

**Result:** Creates material swatches and color palettes for each table

---

### Example 5: Cloud Storage Import with Lifestyle Images

1. Click **Upload** tab
2. Select **Cloud Storage** source
3. Choose **Dropbox**
4. Enter path: `/Products/Chairs`
5. Enable **Auto-detect**
6. Click **Upload**

**Result:** All images in folder processed with:
- Background removal
- Lifestyle image creation
- Multiple output formats

---

## Job Tracking

After uploading, track processing jobs in the **Job Tracker** section.

**Job Statuses:**
- 🔵 **Pending** - Job queued
- 🔵 **Processing** - Currently processing (animated)
- 🟢 **Completed** - Successfully finished
- 🔴 **Failed** - Error occurred

**Auto-refresh:** Job tracker updates every 5 seconds

---

## Batch Processing Configuration

For large batches, you can configure processing per image:

1. Upload multiple images
2. Click **Configure Processing**
3. Disable **Auto-detect**
4. For each image, select specific operations
5. Click **Upload**

**Future feature:** UI for per-image configuration (currently applies global settings)

---

## API Integration

All upload sources and processing options are available via API.

**Endpoints:**
```
POST /api/v1/uploads              - File upload
POST /api/v1/uploads/urls         - URL import
POST /api/v1/uploads/product-page - Page scraping
POST /api/v1/uploads/cloud        - Cloud storage
```

**Processing:**
```
POST /api/v1/process/batch
Body: {
  uploadId: "uuid",
  imageProcessing: {
    "image-id-1": ["bg-remove", "resize"],
    "image-id-2": ["retouch", "compress"]
  }
}
```

See **API_REFERENCE.md** for complete documentation.

---

## Best Practices

### 1. **Use Auto-Detection for Mixed Content**
If your images vary (some need backgrounds removed, others need enhancement), use auto-detection.

### 2. **Batch Similar Operations**
If all images need the same processing, disable auto-detect and select global operations for faster processing.

### 3. **Use CSV for Large Imports**
For 100+ products, use CSV import rather than manual URL entry.

### 4. **Leverage Product Page Scraping**
When migrating from another platform, use product page scraping to quickly import entire catalogs.

### 5. **Compress for Web**
Always enable compression & optimization for images that will be displayed on websites.

### 6. **Generate 360° for Key Products**
Use 360° spin videos for high-value products to increase conversions.

---

## Troubleshooting

### Upload Failed
**Cause:** Network error or authentication issue
**Fix:** Refresh page and try again. Check internet connection.

### Foreign Key Error
**Cause:** Profile not created
**Fix:** This is now automatically handled. Logout and login again if you see this.

### Processing Takes Too Long
**Cause:** Heavy operations (3D modeling, 360° render)
**Fix:** These operations can take 5-30 minutes. Check Job Tracker for status.

### Cloud Storage Authentication Failed
**Cause:** Not connected to cloud provider
**Fix:** Backend needs to implement OAuth flow for Dropbox/Google Drive

### CSV Not Parsing
**Cause:** Incorrect format
**Fix:** Ensure first column contains image URLs and file is valid CSV

---

## Quotas & Limits

**Free Tier:**
- 100 images/day
- 10 processing jobs/day
- Basic operations only

**Pro Tier:**
- 1,000 images/day
- 100 processing jobs/day
- All operations available

**Enterprise:**
- Unlimited uploads
- Unlimited processing
- Custom operations
- Priority processing

---

## Cost Estimates

**Per Image:**
- Background Removal: $0.05
- Image Enhancement: $0.02
- 3D Modeling: $0.50-$2.00
- 360° Spin: $0.10
- Other operations: $0.01-$0.05

**Batch Discounts:** Available for 1000+ images

---

## Support

For questions or issues:
- Email: support@furniture-visualizer.com
- Documentation: https://docs.furniture-visualizer.com
- API Reference: See API_REFERENCE.md

---

## Next Steps

1. **Sign up** and create an account
2. **Upload test images** to see the system in action
3. **Enable auto-detection** for smart processing
4. **Review results** in the Job Tracker
5. **Download processed images** or 3D models
6. **Integrate with your store** using our API

Happy uploading!
