#!/bin/bash

# Image Optimization Script for MERN App
# This script optimizes all images in the public/img directory

echo "🖼️  Starting image optimization..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install imagemagick
    else
        echo "Please install ImageMagick manually:"
        echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
        echo "  MacOS: brew install imagemagick"
        exit 1
    fi
fi

# Navigate to the img directory
cd "$(dirname "$0")/../client/public/img" || exit

# Create a backup
echo "📦 Creating backup..."
if [ ! -d "backup" ]; then
    mkdir backup
    cp -r ./* backup/
    echo "✅ Backup created in img/backup/"
fi

# Optimize main-bg.png (the biggest culprit - 5.7MB!)
echo "🔧 Optimizing main-bg.png (5.7MB → ~500KB)..."
if [ -f "main-page/main-bg.png" ]; then
    # Convert to JPG and resize if needed
    convert main-page/main-bg.png \
        -resize '1920x1080>' \
        -quality 85 \
        -strip \
        main-page/main-bg-optimized.jpg
    
    # Create WebP version (even smaller!)
    if command -v cwebp &> /dev/null; then
        cwebp -q 85 main-page/main-bg.png -o main-page/main-bg.webp
        echo "✅ Created WebP version: main-bg.webp"
    fi
    
    echo "✅ Optimized main-bg.png"
    echo "   Original: $(du -h main-page/main-bg.png | cut -f1)"
    echo "   Optimized: $(du -h main-page/main-bg-optimized.jpg | cut -f1)"
fi

# Optimize all PNGs in main-package
echo "🔧 Optimizing main-package images..."
for file in main-package/*.png; do
    if [ -f "$file" ] && [[ ! "$file" =~ "-optimized" ]]; then
        filename=$(basename "$file" .png)
        convert "$file" \
            -quality 85 \
            -strip \
            "${file%.png}-optimized.jpg"
        echo "✅ Optimized $filename"
    fi
done

# Optimize all images in price-est subdirectories
echo "🔧 Optimizing price-est images..."
find price-est -type f -name "*.png" | while read file; do
    if [[ ! "$file" =~ "-optimized" ]]; then
        dir=$(dirname "$file")
        filename=$(basename "$file" .png)
        convert "$file" \
            -quality 85 \
            -strip \
            "${file%.png}-optimized.jpg"
        echo "✅ Optimized $filename"
    fi
done

# Optimize logo images
echo "🔧 Optimizing logo images..."
for file in logo/*.png; do
    if [ -f "$file" ] && [[ ! "$file" =~ "-optimized" ]]; then
        filename=$(basename "$file" .png)
        # Logos can use PNG for transparency, but optimize them
        convert "$file" \
            -strip \
            -define png:compression-level=9 \
            "${file%.png}-optimized.png"
        echo "✅ Optimized $filename"
    fi
done

echo ""
echo "🎉 Optimization complete!"
echo ""
echo "📊 Space saved:"
ORIGINAL_SIZE=$(du -sh . | cut -f1)
echo "   Check your backup folder to compare"
echo ""
echo "📝 Next steps:"
echo "   1. Update image references in your code to use -optimized versions"
echo "   2. Or rename optimized files to replace originals"
echo "   3. Redeploy to Netlify"
echo ""
echo "💡 Pro tip: Use WebP versions for even better performance!"
