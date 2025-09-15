import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Clean motor name function to strip HTML tags and normalize text
function cleanMotorName(rawName: string): string {
  if (!rawName) return '';
  
  return rawName
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&lt;|&gt;/g, '') // Remove escaped brackets
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Parse motor title components exactly as they appear on harrisboatworks.ca
function parseMotorTitle(title: string) {
  // First, ensure title is completely clean
  const clean = title
    .replace(/<[^>]*>/g, '')  // Remove any HTML
    .replace(' - Mercury', '')
    .replace(/[<>]/g, '')      // Remove stray brackets
    .replace(/&lt;/g, '<')     // Decode HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
  
  console.log(`Parsing: "${clean}"`);
  
  // Handle special cases like "FourStroke 2." or "FourStroke 3."
  if (clean.match(/FourStroke\s+\d+\.?$/)) {
    // This is likely a small HP motor like 2.5HP or 3.5HP
    const hp = clean.match(/(\d+\.?\d*)/)[1];
    return {
      year: new Date().getFullYear(),
      category: 'FourStroke',
      horsepower: parseFloat(hp),
      fuelType: '',
      modelCode: '',
      fullTitle: clean,
      displayTitle: `${new Date().getFullYear()} FourStroke ${hp}HP`,
      isValid: true
    };
  }
  
  // Split the title into parts
  const parts = clean.split(/\s+/);
  
  // Extract components
  const year = parts.find(p => /^\d{4}$/.test(p)) || new Date().getFullYear().toString();
  const category = parts.find(p => /^(FourStroke|ProXS|SeaPro|Verado|Racing)/i.test(p)) || '';
  
  // Find HP (might be like "25HP" or just "25")
  let horsepower = '';
  let hpIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].match(/^\d+\.?\d*HP$/i)) {
      horsepower = parts[i];
      hpIndex = i;
      break;
    } else if (parts[i].match(/^\d+\.?\d*$/) && i + 1 < parts.length && parts[i + 1].toUpperCase() === 'HP') {
      horsepower = parts[i] + 'HP';
      hpIndex = i + 1;
      break;
    }
  }
  
  // Check if EFI exists
  const fuelType = parts.includes('EFI') ? 'EFI' : '';
  
  // CRITICAL: Model code is everything after HP that's not EFI
  let modelCode = '';
  if (hpIndex !== -1) {
    const afterHP = parts.slice(hpIndex + 1);
    modelCode = afterHP
      .filter(p => p !== 'EFI' && p !== 'TM' && p !== '-')
      .join(' ')
      .trim();
  }

  // Special case: Some motors have code right after HP without space (like "25HPELHPT")
  if (!modelCode && horsepower.match(/HP([A-Z]+)/i)) {
    modelCode = horsepower.match(/HP([A-Z]+)/i)[1];
  }
  
  console.log(`Parsed: ${clean} -> Year:${year}, Cat:${category}, HP:${horsepower}, Fuel:${fuelType}, Model:${modelCode}`);
  
  return {
    year: parseInt(year) || 2025,
    category: category || 'FourStroke',
    horsepower: parseFloat(horsepower.replace('HP', '')) || 0,
    fuelType: fuelType || '',
    modelCode: modelCode || '', // THIS MUST NOT BE EMPTY for motors like "ELHPT", "XL", etc.
    fullTitle: clean,
    displayTitle: modelCode ? 
      `${year} ${category} ${horsepower} ${fuelType} ${modelCode}`.replace(/\s+/g, ' ').trim() :
      `${year} ${category} ${horsepower} ${fuelType}`.replace(/\s+/g, ' ').trim(),
    isValid: true
  };
}

// Helper function to make URLs absolute
function makeAbsoluteUrl(url: string): string | null {
  if (!url) return null;
  
  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Protocol-relative
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  // Relative to domain
  if (url.startsWith('/')) {
    return 'https://www.harrisboatworks.ca' + url;
  }
  
  // Relative to current path
  return 'https://www.harrisboatworks.ca/search/inventory/brand/Mercury/' + url;
}

// Extract motor images from HTML elements with enhanced debugging
async function extractMotorImages(element: any): Promise<any> {
  console.log('Extracting image from element:', element.outerHTML?.substring(0, 200) || 'No HTML available');
  
  try {
    // Try multiple selectors
    const imgElement = await element.$('img') || 
                       await element.$('.product-image img') ||
                       await element.$('[data-image]') ||
                       await element.$('picture img');
    
    if (!imgElement) {
      console.error('No image element found');
      return null;
    }
    
    // Get all possible image sources
    const src = await imgElement.getAttribute('src');
    const dataSrc = await imgElement.getAttribute('data-src');
    const dataLarge = await imgElement.getAttribute('data-large-image');
    const dataOriginal = await imgElement.getAttribute('data-original');
    const dataFull = await imgElement.getAttribute('data-full');
    
    console.log('Found image sources:', { src, dataSrc, dataLarge, dataOriginal, dataFull });
    
    // Return the best available image (prioritize full-size)
    return {
      fullSize: dataLarge || dataFull || dataOriginal || null,
      medium: dataSrc || src || null,
      thumbnail: src || null
    };
  } catch (error) {
    console.error('Error extracting motor images:', error);
    return null;
  }
}

// Validate image URLs to ensure they're full-size
async function validateImageUrl(imageUrl: string, motorTitle: string): Promise<string | null> {
  if (!imageUrl) return null;
  
  try {
    // Verify it's a full-size image (not thumbnail)
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    
    // Full-size images should be > 50KB, thumbnails are usually < 20KB
    if (contentLength && parseInt(contentLength) < 50000) {
      console.warn(`Image might be thumbnail for ${motorTitle}: ${contentLength} bytes - ${imageUrl}`);
    } else {
      console.log(`Image validated for ${motorTitle}: ${imageUrl} (${contentLength} bytes)`);
    }
    
    return imageUrl;
    
  } catch (error) {
    console.error(`Failed to validate image for ${motorTitle}:`, error);
    return imageUrl; // Return it anyway, validation failed doesn't mean image is bad
  }
}

// Extract additional motor data from harrisboatworks.ca structure with enhanced price extraction
function extractMotorData(text: string) {
  const data = {
    salePrice: null,
    msrp: null,
    savings: null,
    stockNumber: null,
    availability: null,
    usage: null
  };
  
  // Enhanced pricing extraction with multiple selectors and patterns
  const pricePatterns = [
    /\$([0-9,]+\.?[0-9]*)/,              // Basic $12,345 or $12,345.99
    /sale[:\s]*\$([0-9,]+\.?[0-9]*)/i,   // Sale: $12,345
    /price[:\s]*\$([0-9,]+\.?[0-9]*)/i,  // Price: $12,345
    /now[:\s]*\$([0-9,]+\.?[0-9]*)/i,    // Now: $12,345
    /special[:\s]*\$([0-9,]+\.?[0-9]*)/i // Special: $12,345
  ];
  
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && !data.salePrice) {
      data.salePrice = parseFloat(match[1].replace(/,/g, ''));
      console.log(`💰 Found sale price: $${data.salePrice} using pattern: ${pattern.source}`);
      break;
    }
  }
  
  // Enhanced MSRP extraction
  const msrpPatterns = [
    /msrp[:\s]*\$([0-9,]+\.?[0-9]*)/i,      // MSRP: $12,345
    /was[:\s]*\$([0-9,]+\.?[0-9]*)/i,       // Was: $12,345
    /list[:\s]*\$([0-9,]+\.?[0-9]*)/i,      // List: $12,345
    /original[:\s]*\$([0-9,]+\.?[0-9]*)/i,  // Original: $12,345
    /regular[:\s]*\$([0-9,]+\.?[0-9]*)/i    // Regular: $12,345
  ];
  
  for (const pattern of msrpPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.msrp = parseFloat(match[1].replace(/,/g, ''));
      console.log(`🏷️ Found MSRP: $${data.msrp} using pattern: ${pattern.source}`);
      break;
    }
  }
  
  // Extract savings
  const savingsMatch = text.match(/You Save \$([0-9,]+\.?[0-9]*)/i);
  if (savingsMatch) {
    data.savings = parseFloat(savingsMatch[1].replace(/,/g, ''));
  }
  
  // Extract stock number
  const stockMatch = text.match(/Stock.*?#?:?\s*([0-9A-Z]+)/i);
  if (stockMatch) {
    data.stockNumber = stockMatch[1];
  }
  
  // Extract availability
  if (text.includes('In Stock')) {
    data.availability = 'In Stock';
  } else if (text.includes('Available')) {
    data.availability = 'Available';
  } else if (text.includes('Special Order')) {
    data.availability = 'Special Order';
  }
  
  // Extract usage
  if (text.includes('New')) {
    data.usage = 'New';
  }
  
  return data;
}

// Extract images from HTML and associate with motors
async function extractImagesFromHTML(html: string, motors: any[]) {
  try {
    console.log('🔍 Starting HTML image extraction...');
    
    // Create a mock DOM parser for server-side HTML parsing
    const imageMatches = html.match(/<img[^>]*src=['"](.*?)['"][^>]*>/gi) || [];
    console.log(`Found ${imageMatches.length} img tags in HTML`);
    
    const extractedImages = [];
    
    for (const imgMatch of imageMatches) {
      const srcMatch = imgMatch.match(/src=['"](.*?)['"]/i);
      const altMatch = imgMatch.match(/alt=['"](.*?)['"]/i);
      const dataFullMatch = imgMatch.match(/data-full-size=['"](.*?)['"]/i);
      const dataLargeMatch = imgMatch.match(/data-large-image=['"](.*?)['"]/i);
      
      if (srcMatch) {
        const imageData = {
          src: makeAbsoluteUrl(srcMatch[1]),
          alt: altMatch?.[1] || '',
          fullSize: makeAbsoluteUrl(dataFullMatch?.[1]) || null,
          large: makeAbsoluteUrl(dataLargeMatch?.[1]) || null,
          context: imgMatch.substring(0, 200) // Store context for matching
        };
        
        // Skip tiny tracking pixels and invalid images
        if (imageData.src && 
            !imageData.src.includes('1x1') && 
            !imageData.src.includes('pixel') &&
            !imageData.src.includes('tracking') &&
            imageData.src.length > 20) {
          extractedImages.push(imageData);
        }
      }
    }
    
    console.log(`📊 Extracted ${extractedImages.length} valid images from HTML`);
    
    // Try to match images to motors
    for (const motor of motors) {
      const motorImages = [];
      let primaryImage = null;
      
      // Look for images that might belong to this motor
      for (const imageData of extractedImages) {
        const shouldInclude = 
          // Check if image alt text contains motor info
          (imageData.alt && (
            imageData.alt.toLowerCase().includes(motor.horsepower.toString()) ||
            imageData.alt.toLowerCase().includes('mercury') ||
            imageData.alt.toLowerCase().includes('outboard')
          )) ||
          // Check if stock number appears in image context
          (motor.stock_number && imageData.context.includes(motor.stock_number)) ||
          // For now, include all valid motor images since matching is difficult
          (imageData.src.toLowerCase().includes('motor') || 
           imageData.src.toLowerCase().includes('outboard') ||
           imageData.src.toLowerCase().includes('mercury'));
        
        if (shouldInclude) {
          // Prefer full-size images
          const bestImage = imageData.fullSize || imageData.large || imageData.src;
          if (bestImage && !motorImages.includes(bestImage)) {
            motorImages.push(bestImage);
            
            // Set primary image to the first good one
            if (!primaryImage) {
              primaryImage = bestImage;
            }
          }
        }
      }
      
      // If no specific matches, assign first few general motor images
      if (motorImages.length === 0 && extractedImages.length > 0) {
        const fallbackImages = extractedImages
          .slice(0, 3) // Take first 3 images as fallback
          .map(img => img.fullSize || img.large || img.src)
          .filter(Boolean);
        
        motorImages.push(...fallbackImages);
        primaryImage = fallbackImages[0] || null;
      }
      
      // Update motor with images
      motor.images = motorImages;
      motor.image_url = primaryImage;
      
      if (motorImages.length > 0) {
        console.log(`🖼️ Assigned ${motorImages.length} images to ${motor.model}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error extracting images from HTML:', error);
  }
}

// Detect total pages from pagination info
function detectTotalPages(html: string, markdown: string = '') {
  // Look for various pagination patterns
  const patterns = [
    /(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/i, // "1 - 30 of 145"
    /showing\s+(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/i, // "Showing 1 - 30 of 145"
    /page\s+\d+\s+of\s+(\d+)/i, // "Page 1 of 5"
    /(\d+)\s+results/i // "145 results"
  ];
  
  const text = html + ' ' + markdown;
  
  // Extract the actual total from the page
  const totalMatch = html.match(/(\d+)\s*of\s*(\d+)\s*results/i) || 
                     html.match(/(\d+)\s*results found/i) ||
                     html.match(/showing.*of\s*(\d+)/i);

  const actualTotal = totalMatch ? parseInt(totalMatch[totalMatch.length - 1]) : 145;
  console.log(`Website shows ${actualTotal} total motors`);

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const totalResults = actualTotal || parseInt(match[3] || match[1]);
      const itemsPerPage = 30; // Standard for harrisboatworks.ca
      const totalPages = Math.ceil(totalResults / itemsPerPage);
      
      console.log(`📊 Pagination detected: ${totalResults} total results, ${totalPages} pages needed`);
      return { totalResults, totalPages, itemsPerPage };
    }
  }
  
  console.log('⚠️ No pagination info found, using default page count');
  return null;
}

// Enhanced motor parsing with comprehensive extraction
async function parseMotorsFromHTML(html: string, markdown: string = '') {
  console.log('🔍 Starting enhanced Mercury motor parsing for harrisboatworks.ca...')
  
  const motors = []
  
  // Detect total available results and pages
  const paginationInfo = detectTotalPages(html, markdown);
  
  // Process markdown first - more reliable for structured data
  const lines = markdown.split('\n').filter(line => line.trim().length > 0);
  console.log('📄 Processing markdown lines:', lines.length);
  
  // Enhanced motor extraction with multiple selector attempts
  const motorSections = [];
  let currentSection = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for motor title patterns
    if (line.match(/(20(?:24|25)).*?(FourStroke|Pro\s*XS|ProXS|SeaPro|Verado).*?\d+.*?HP/i)) {
      // Filter out non-motor items early
      if (line.toLowerCase().includes('ideal for') || 
          line.toLowerCase().includes('perfect for') ||
          line.toLowerCase().includes('controls required') ||
          !line.match(/\d+/)) {  // Must have at least one number (HP or year)
        console.log(`Skipping non-motor item: "${line}"`);
        continue;
      }
      
      // Save previous section if it exists
      if (currentSection.length > 0) {
        motorSections.push(currentSection.join(' '));
        currentSection = [];
      }
      currentSection.push(line);
    }
    // Look for pricing and details in next few lines
    else if (currentSection.length > 0 && currentSection.length < 8) {
      if (line.match(/\$[\d,]+|stock|save|available|in stock|new/i)) {
        currentSection.push(line);
      }
    }
    // Section complete after 8 lines or when hitting new motor
    else if (currentSection.length >= 8) {
      motorSections.push(currentSection.join(' '));
      currentSection = [];
    }
  }
  
  // Don't forget the last section
  if (currentSection.length > 0) {
    motorSections.push(currentSection.join(' '));
  }
  
  console.log(`🎯 Found ${motorSections.length} potential motor sections`);
  
  // Process each motor section
  for (const section of motorSections) {
    const parsed = parseMotorTitle(section);
    if (parsed && parsed.horsepower >= 15 && parsed.horsepower <= 400) {
      const additionalData = extractMotorData(section);
      
      // Enhanced motor object with comprehensive data including images
        const motor = {
          make: 'Mercury',
          model: parsed.displayTitle, // Clean format: "2025 FourStroke 25HP EFI ELHPT"
          horsepower: parsed.horsepower,
          motor_type: parsed.category,
          base_price: additionalData.salePrice,
          sale_price: additionalData.salePrice,
          msrp: additionalData.msrp || (additionalData.salePrice && additionalData.savings ? 
            additionalData.salePrice + additionalData.savings : null),
          savings: additionalData.savings,
          stock_number: additionalData.stockNumber,
          availability: additionalData.availability || 'Available',
          usage: additionalData.usage || 'New',
          year: parsed.year,
          engine_type: parsed.fuelType, // Map fuel_type to engine_type column
          full_title: parsed.fullTitle,
          section_text: section.substring(0, 200), // Debug info
          images: [], // Will be populated from HTML parsing
          image_url: null // Will be set from first valid image
        };
      
      console.log('🎯 Parsed Mercury motor:', `${motor.year} ${motor.model} (Stock: ${motor.stock_number})`);
      motors.push(motor);
    }
  }
  
  // If markdown parsing failed, try HTML fallback with enhanced extraction
  if (motors.length === 0) {
    console.log('⚠️ No motors found in markdown, trying enhanced HTML parsing...');
    
    // Remove scripts and styles, extract text content
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Look for Mercury motor patterns in clean text
    const htmlSections = cleanHtml.split(/mercury|outboard|motor/i)
      .filter(section => section.match(/\d+.*?HP/i) && section.length < 500);
    
    console.log(`🔍 Found ${htmlSections.length} HTML motor sections`);
    
    for (const section of htmlSections) {
      const parsed = parseMotorTitle(section);
      if (parsed && parsed.horsepower >= 15 && parsed.horsepower <= 400) {
        const additionalData = extractMotorData(section);
        
        const motor = {
          make: 'Mercury',
          model: parsed.displayTitle,
          horsepower: parsed.horsepower,
          motor_type: parsed.category,
          base_price: additionalData.salePrice,
          sale_price: additionalData.salePrice,
          msrp: additionalData.msrp,
          savings: additionalData.savings,
          stock_number: additionalData.stockNumber,
          availability: additionalData.availability || 'Available',
          usage: additionalData.usage || 'New',
          year: parsed.year,
          model_code: parsed.modelCode,
          fuel_type: parsed.fuelType,
          full_title: parsed.fullTitle,
          source: 'html_fallback',
          images: [], // Will be populated from HTML parsing
          primary_image: null // Will be set from first valid image
        };
        
        console.log('🎯 Parsed Mercury motor (HTML):', `${motor.year} ${motor.model}`);
        motors.push(motor);
      }
    }
  }
  
  // Extract images from HTML for all motors
  console.log('🖼️ Extracting images from HTML...');
  await extractImagesFromHTML(html, motors);
  
  // Validate image counts
  const motorsWithImages = motors.filter(m => m.images && m.images.length > 0);
  const motorsWithoutImages = motors.filter(m => !m.images || m.images.length === 0);
  console.log(`📊 Image extraction: ${motorsWithImages.length} motors with images, ${motorsWithoutImages.length} without images`);
  
  if (motorsWithoutImages.length > 0) {
    console.log('⚠️ Motors without images:', motorsWithoutImages.map(m => m.model).slice(0, 5));
  }
  
  // Enhanced deduplication using stock number, then model+HP
  const uniqueMotors = [];
  const seen = new Set();
  
  for (const motor of motors) {
    let uniqueKey;
    
    // Use stock number if available, otherwise model + HP
    if (motor.stock_number && motor.stock_number.length > 0) {
      uniqueKey = motor.stock_number;
    } else {
      uniqueKey = `${motor.model}_${motor.horsepower}`;
    }
    
    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      uniqueMotors.push(motor);
    } else {
      console.log(`🔄 Duplicate removed: ${motor.model} (${uniqueKey})`);
    }
  }
  
  console.log(`🧹 Enhanced deduplication: ${motors.length} → ${uniqueMotors.length} unique motors`);
  
  return {
    motors: uniqueMotors,
    debugInfo: {
      html_length: html.length,
      markdown_length: markdown.length,
      motor_sections_found: motorSections.length,
      total_matches: motors.length,
      unique_motors: uniqueMotors.length,
      pagination_info: paginationInfo,
      deduplication_method: 'stock_number_primary'
    }
  }
}

// Download and store image in Supabase Storage
async function downloadAndStoreImage(imageUrl: string, motor: any, supabase: any): Promise<string | null> {
  if (!imageUrl) return null;
  
  try {
    console.log(`📥 Downloading image for ${motor.make} ${motor.model} ${motor.horsepower}HP`);
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to download image: ${response.status} ${response.statusText} for ${imageUrl}`);
      return imageUrl; // Return original URL as fallback
    }
    
    const imageBlob = await response.blob();
    
    // Check if it's a reasonable size (avoid thumbnails)
    if (imageBlob.size < 50000) { // Less than 50KB likely a thumbnail
      console.warn(`Image might be thumbnail (${imageBlob.size} bytes) for ${motor.stock_number}`);
    }
    
    // Create organized filename
    const year = motor.year || 2025;
    const stockNumber = motor.stock_number || `motor-${Date.now()}`;
    const category = (motor.motor_type || 'outboard').toLowerCase().replace(/\s+/g, '-');
    const hp = motor.horsepower || 0;
    
    const filename = `mercury/${year}/${stockNumber}-${category}-${hp}hp.jpg`
      .replace(/[^a-zA-Z0-9\-\/\.]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('motor-images')
      .upload(filename, imageBlob, {
        contentType: imageBlob.type || 'image/jpeg',
        upsert: true, // Replace if exists
        cacheControl: '3600'
      });
    
    if (error) {
      console.error(`Failed to upload image for ${stockNumber}:`, error);
      return imageUrl; // Return original URL as fallback
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('motor-images')
      .getPublicUrl(filename);
    
    console.log(`✅ Stored image for ${motor.make} ${motor.model}: ${filename}`);
    return publicUrl;
    
  } catch (error) {
    console.error(`Error processing image for ${motor.stock_number}:`, error);
    return imageUrl; // Return original URL as fallback
  }
}

// Database save function with image storage
async function saveMotorsToDatabase(motors: any[]) {
  console.log('💾 Attempting to save motors to database...')
  let savedCount = 0
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Check for existing motors and update or insert
  const { data: existingMotors, error: fetchError } = await supabase
    .from('motor_models')
    .select('id, make, model, horsepower')
    .eq('make', 'Mercury')

  if (fetchError) {
    console.error('Error fetching existing motors:', fetchError)
    return 0
  }

  for (const motor of motors) {
    try {
      // Clean the model name before saving
      const cleanModel = cleanMotorName(motor.model);
      
      // Download and store image in Supabase Storage
      const imageUrl = motor.primary_image || motor.images?.fullSize || motor.images?.large;
      let storedImageUrl = imageUrl;
      let originalImageUrl = imageUrl;
      
      if (imageUrl) {
        storedImageUrl = await downloadAndStoreImage(imageUrl, motor, supabase);
      }
      
      // Check if motor already exists
      const existing = existingMotors?.find(existing => 
        existing.make === motor.make &&
        existing.model === cleanModel &&
        Math.abs(existing.horsepower - motor.horsepower) < 0.1
      )

      if (existing) {
        // Update existing motor with clean data and new image
        const updateData: any = {
          model: cleanModel,
          motor_type: motor.motor_type,
          year: motor.year,
          updated_at: new Date().toISOString(),
          last_scraped: new Date().toISOString()
        };
        
        // Update image URLs if we have them
        if (storedImageUrl) {
          updateData.image_url = storedImageUrl;
          updateData.images = {
            ...motor.images,
            storage_url: storedImageUrl,
            original_url: originalImageUrl
          };
        }
        
        const { error: updateError } = await supabase
          .from('motor_models')
          .update(updateData)
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating motor:', updateError)
        } else {
          savedCount++
          console.log(`✅ Updated: ${motor.make} ${cleanModel} ${motor.horsepower}HP`)
        }
      } else {
        // Insert new motor with clean data and stored images
        const insertData = {
          make: motor.make,
          model: cleanModel,
          horsepower: motor.horsepower,
          motor_type: motor.motor_type,
          base_price: motor.base_price || motor.sale_price,
          sale_price: motor.sale_price,
          stock_number: motor.stock_number,
          availability: motor.availability || 'Available',
          year: motor.year,
          images: {
            ...motor.images,
            storage_url: storedImageUrl,
            original_url: originalImageUrl
          },
          image_url: storedImageUrl || motor.primary_image,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_scraped: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('motor_models')
          .insert(insertData)

        if (insertError) {
          console.error('Error inserting motor:', insertError)
        } else {
          savedCount++
          console.log(`✅ Inserted: ${motor.make} ${cleanModel} ${motor.horsepower}HP`)
        }
      }
    } catch (error) {
      console.error('❌ Database error for motor:', motor.model, error)
    }
  }
  
  return savedCount
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Health check endpoint
  if (req.method === 'GET' && new URL(req.url).pathname === '/health') {
    return new Response(JSON.stringify({ status: 'healthy' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const startTime = Date.now()
    const requestBody = await req.json()
    const { pages_to_scrape = 6 } = requestBody // Increased default to capture all 145+ motors
    
    // Get environment variables
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY is required')
    }

    console.log('🚀 Starting enhanced Mercury motor scrape for harrisboatworks.ca...')
    console.log('📄 Pages to scrape:', pages_to_scrape)

    // Mercury-specific URL for harrisboatworks.ca inventory
    const baseUrl = 'https://www.harrisboatworks.ca/search/inventory/brand/Mercury'
    
    // Arrays to collect data from all pages
    const allMotors = []
    const pageResults = []
    const errors = []
    let detectedTotalPages = pages_to_scrape;
    let totalExpectedMotors = 0;
    
    // Test which pagination pattern works BEFORE the main loop
    console.log('Testing pagination patterns...');
    let workingPattern = '?page=';
    
    const testUrls = [
      `${baseUrl}?page=2`,
      `${baseUrl}&page=2`, 
      `${baseUrl}/page/2`,
      `${baseUrl}#page=2`
    ];

    // Quick test of pagination patterns (only for page 2)
    for (const testUrl of testUrls) {
      try {
        const testResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: testUrl,
            formats: ['html'],
            pageOptions: { waitFor: 1000 }
          })
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          const hasProducts = testData.data?.html?.includes('Mercury') && testData.data?.html?.includes('HP');
          console.log(`${testUrl}: ${hasProducts ? '✓ WORKS' : '✗ FAILS'}`);
          
          if (hasProducts) {
            if (testUrl.includes('?page=')) workingPattern = '?page=';
            else if (testUrl.includes('&page=')) workingPattern = '&page=';
            else if (testUrl.includes('/page/')) workingPattern = '/page/';
            break; // Found working pattern, stop testing
          }
        }
      } catch (e) {
        console.log(`${testUrl}: ✗ ERROR - ${e.message}`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`📍 Using pagination pattern: ${workingPattern}`);

    // Enhanced pagination loop with smart detection
    for (let pageNum = 1; pageNum <= Math.max(pages_to_scrape, detectedTotalPages); pageNum++) {
      try {
        // Small delay between requests to be respectful
        if (pageNum > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // Better pagination URL pattern
        let currentUrl;
        if (pageNum === 1) {
          currentUrl = baseUrl;
        } else {
          // Check if base URL already has parameters
          if (baseUrl.includes('?')) {
            currentUrl = `${baseUrl}&page=${pageNum}`;
          } else {
            currentUrl = `${baseUrl}?page=${pageNum}`;
          }
        }
        
        console.log(`\n=== SCRAPING PAGE ${pageNum} ===`);
        console.log(`URL: ${currentUrl}`);
        
        // Verify we're on the right page would happen after Firecrawl response
        console.log(`Using pagination pattern: ${workingPattern}`);
        
        // Enhanced Firecrawl API call with wait conditions
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: currentUrl,
            formats: ['html', 'markdown'],
            pageOptions: {
              waitFor: 2000, // Wait for content to load
              waitForSelector: 'img[src]', // Wait for images to load
              screenshot: false,
              fullPageScreenshot: false,
              includeHtml: true
            },
            extractorOptions: {
              mode: 'llm-extraction',
              extractionPrompt: 'Extract all Mercury outboard motor listings with titles, prices, stock numbers, and specifications'
            }
          })
        })
        
        console.log('Firecrawl status:', firecrawlResponse.status)
        
        if (firecrawlResponse.ok) {
          const firecrawlData = await firecrawlResponse.json()
          
          // Parse motors from current page
          const htmlData = firecrawlData.data?.html || ''
          const markdownData = firecrawlData.data?.markdown || ''
          
          // After navigation, verify we're on the right page
          const currentURL = firecrawlData.data?.metadata?.url || currentUrl;
          console.log(`Actually scraped: ${currentURL}`);

          // Check how many motors are on this page
          const motorMatches = htmlData.match(/mercury.*?\d+.*?hp/gi) || [];
          console.log(`Motors found on page ${pageNum}: ${motorMatches.length}`);
          
          // Enhanced debugging
          console.log('HTML length:', htmlData.length)
          console.log('Contains Mercury?', htmlData.toLowerCase().includes('mercury'))
          
          // Debug pagination on first page
          if (pageNum === 1) {
            const hasPageLinks = htmlData.includes('page=2') || htmlData.includes('/page/2');
            const paginationLinks = htmlData.match(/href="[^"]*page[=\/](\d+)/g) || [];
            console.log('🔍 Pagination debug:', { hasPageLinks, paginationLinks: paginationLinks.slice(0, 5) });
          }
          
           const parseResult = await parseMotorsFromHTML(htmlData, markdownData)
           const pageMotors = parseResult.motors
           const debugInfo = parseResult.debugInfo
           
           console.log(`🏗️ Page ${pageNum} parsed motors:`, pageMotors.length)
           
           // Add debug to find missing motors
           console.log(`Page ${pageNum} motor titles:`);
           pageMotors.forEach((m, i) => {
             console.log(`  ${i+1}. ${m.full_title || m.model} | Model: "${m.model_code || 'MISSING'}"`);
           });
          
          // Update pagination detection on first page
          if (pageNum === 1 && debugInfo.pagination_info) {
            detectedTotalPages = Math.min(debugInfo.pagination_info.totalPages, 10); // Safety cap
            totalExpectedMotors = debugInfo.pagination_info.totalResults;
            console.log(`📊 Auto-detected: ${totalExpectedMotors} total motors across ${detectedTotalPages} pages`);
          }
          
          // Add motors from this page to the total
          allMotors.push(...pageMotors)
          
          // Record page result
          pageResults.push({
            page: pageNum,
            url: currentUrl,
            success: true,
            motors_found: pageMotors.length,
            html_length: htmlData.length,
            markdown_length: markdownData.length
          })
          
        } else {
          const errorText = await firecrawlResponse.text()
          console.error(`❌ Page ${pageNum} failed: ${firecrawlResponse.status} - ${errorText}`)
          
          errors.push({
            page: pageNum,
            url: currentUrl,
            status: firecrawlResponse.status,
            error: errorText
          })
          
          pageResults.push({
            page: pageNum,
            url: currentUrl,
            success: false,
            error: errorText,
            motors_found: 0
          })
        }
      } catch (pageError) {
        console.error(`❌ Page ${pageNum} error:`, pageError.message)
        errors.push({
          page: pageNum,
          error: pageError.message
        })
        
        pageResults.push({
          page: pageNum,
          url: currentUrl,
          success: false,
          error: pageError.message,
          motors_found: 0
        })
      }
    }
    
    console.log('🔍 All pages scraped. Total motors found:', allMotors.length)
    console.log(`📊 Expected vs Found: ${totalExpectedMotors} expected, ${allMotors.length} found`)
    
    // Check if there are more pages if we're missing motors
    if (allMotors.length < 145) {
      console.log('\n⚠️ Still missing motors, checking for more pages...');
      
      // Try page 6, 7, etc.
      for (let extraPage = detectedTotalPages + 1; extraPage <= detectedTotalPages + 3; extraPage++) {
        const extraUrl = baseUrl.includes('?') ? `${baseUrl}&page=${extraPage}` : `${baseUrl}?page=${extraPage}`;
        console.log(`Checking extra page ${extraPage}: ${extraUrl}`);
        
        try {
          const extraResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: extraUrl, formats: ['html', 'markdown'] })
          });
          
          if (extraResponse.ok) {
            const extraData = await extraResponse.json();
            const extraHtml = extraData.data?.html || '';
            const extraMarkdown = extraData.data?.markdown || '';
            const extraResult = await parseMotorsFromHTML(extraHtml, extraMarkdown);
            const extraMotors = extraResult.motors;
            
            if (extraMotors.length > 0) {
              console.log(`✓ Found ${extraMotors.length} more motors on page ${extraPage}!`);
              allMotors.push(...extraMotors);
            } else {
              console.log(`No motors on page ${extraPage}, stopping.`);
              break;
            }
          }
        } catch (error) {
          console.log(`Error checking extra page ${extraPage}:`, error.message);
          break;
        }
      }
    }
    
    // Enhanced Validation Report
    console.log('\n' + '='.repeat(60));
    console.log('CRITICAL VALIDATION REPORT');
    console.log('='.repeat(60));

    // Group motors by category to see distribution
    const categories = {};
    allMotors.forEach(m => {
      const cat = m.category || 'Unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const validation = {
      withImages: allMotors.filter(m => m.primary_image || (m.images && m.images.length > 0)).length,
      withPrices: allMotors.filter(m => m.sale_price || m.base_price).length,
      withModelCodes: allMotors.filter(m => m.model_code).length,
      callForPrice: allMotors.filter(m => m.sale_price === 'Call for Price' || m.base_price === 'Call for Price').length
    };

    console.log(`\n📊 FINAL COUNTS:`);
    console.log(`Total Motors: ${allMotors.length}/145 ${allMotors.length >= 145 ? '✅' : '❌ MISSING ' + (145 - allMotors.length)}`);
    console.log(`With Model Codes: ${validation.withModelCodes}`);
    console.log(`With Images: ${validation.withImages}`);
    console.log(`With Prices: ${validation.withPrices}`);
    console.log(`"Call for Price": ${validation.callForPrice}`);

    console.log(`\n📊 BY CATEGORY:`);
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} motors`);
    });

    // List some motors without model codes as examples
    const noModelCode = allMotors.filter(m => !m.model_code).slice(0, 5);
    if (noModelCode.length > 0) {
      console.log(`\n⚠️ Examples without model codes:`);
      noModelCode.forEach(m => console.log(`  - "${m.full_title || m.model}"`));
    }
    if (noModelCode.length > 0) {
      console.log('\nWARNING - Motors missing model codes:');
      noModelCode.slice(0, 5).forEach(m => {
        console.log(`  - ${m.model || m.full_title}`);
      });
    }

    // Check if we got all pages
    if (allMotors.length < 145) {
      console.error('\n❌ CRITICAL: Not all motors scraped! Check pagination.');
      console.log('Hint: The site might use ?page=2 or &page=2 or different pagination');
    } else {
      console.log('\n✅ SUCCESS: Motor count meets expectations');
    }
    
    // Log sample motor to verify data quality
    if (allMotors.length > 0) {
      console.log('\n📋 Sample motor data:');
      console.log('- Title:', allMotors[0].full_title || allMotors[0].model);
      console.log('- Model Code:', allMotors[0].model_code || 'MISSING');
      console.log('- Primary Image:', allMotors[0].primary_image || 'MISSING');
      console.log('- Stock Number:', allMotors[0].stock_number || 'MISSING');
    }
    
    // Enhanced cross-page deduplication using stock numbers
    const uniqueMotors = [];
    const seenStockNumbers = new Set();
    const seenModelHp = new Set();
    
    for (const motor of allMotors) {
      let isUnique = false;
      
      // Primary: Use stock number if available
      if (motor.stock_number && motor.stock_number.length > 0) {
        if (!seenStockNumbers.has(motor.stock_number)) {
          seenStockNumbers.add(motor.stock_number);
          isUnique = true;
        }
      }
      // Fallback: Use model + horsepower
      else {
        const modelHpKey = `${motor.model}_${motor.horsepower}`;
        if (!seenModelHp.has(modelHpKey)) {
          seenModelHp.add(modelHpKey);
          isUnique = true;
        }
      }
      
      if (isUnique) {
        uniqueMotors.push(motor);
      } else {
        console.log(`🔄 Cross-page duplicate removed: ${motor.model} (Stock: ${motor.stock_number})`);
      }
    }
    
    console.log('🧹 Unique motors after enhanced cross-page deduplication:', uniqueMotors.length)
    
    // Validate motor count expectations
    if (totalExpectedMotors > 0) {
      const captureRate = (uniqueMotors.length / totalExpectedMotors) * 100;
      console.log(`📈 Capture rate: ${captureRate.toFixed(1)}% (${uniqueMotors.length}/${totalExpectedMotors})`);
      
      if (captureRate < 80) {
        console.log('⚠️ LOW CAPTURE RATE - May need more pages or different scraping approach');
      } else if (captureRate >= 95) {
        console.log('✅ EXCELLENT CAPTURE RATE - Successfully captured most/all motors');
      }
    }
    
    // Clean and validate motors before saving
    const cleanedMotors = uniqueMotors
      .filter(motor => {
        // Must have a title and it must look like a motor
        return motor.model && 
               !motor.model.toLowerCase().includes('ideal for') &&
               (motor.model.match(/\d+HP/i) || motor.model.match(/FourStroke|ProXS|SeaPro/i));
      })
      .map(motor => {
        // Final cleaning - remove any remaining HTML artifacts
        let cleanedTitle = motor.model;
        if (typeof motor.model === 'string' && (motor.model.includes('<') || motor.model.includes('>'))) {
          cleanedTitle = motor.model.replace(/<[^>]*>/g, '').trim();
          console.log(`Cleaned HTML from title: "${motor.model}" -> "${cleanedTitle}"`);
        }
        return {
          ...motor,
          model: cleanedTitle
        };
      });

    console.log(`\nFiltered motors: ${cleanedMotors.length} valid motors (from ${uniqueMotors.length} total)`);

    // Debug: Show what we actually scraped
    console.log('\n' + '='.repeat(60));
    console.log('SAMPLE OF SCRAPED MOTORS (First 10):');
    console.log('='.repeat(60));

    cleanedMotors.slice(0, 10).forEach((motor, index) => {
      console.log(`\n${index + 1}. RAW TITLE: "${motor.model}"`);
      console.log(`   PARSED:`);
      console.log(`   - Year: "${motor.year}"`);
      console.log(`   - Category: "${motor.motor_type}"`);
      console.log(`   - HP: "${motor.horsepower}"`);
      console.log(`   - Engine Type: "${motor.engine_type}"`);
      console.log(`   - Has Image: ${motor.image_url ? 'Yes' : 'No'}`);
      console.log(`   - Price: ${motor.sale_price || 'Call for Price'}`);
      console.log(`   - Stock: ${motor.stock_number || 'N/A'}`);
    });

    // Check for common issues
    const htmlInTitles = cleanedMotors.filter(m => 
      m.model && (m.model.includes('<') || 
      m.model.includes('>') || 
      m.model.includes('data-'))
    );

    const noEngineType = cleanedMotors.filter(m => 
      !m.engine_type && 
      m.model && (m.model.includes('ELHPT') || 
       m.model.includes('XL') || 
       m.model.includes('EH') ||
       m.model.includes('EXLPT'))
    );

    const missingPrices = cleanedMotors.filter(m => !m.sale_price);

    if (htmlInTitles.length > 0) {
      console.log('\n⚠️ WARNING: Some titles still have HTML:');
      htmlInTitles.slice(0, 3).forEach(m => console.log(`  - "${m.model}"`));
    }

    if (noEngineType.length > 0) {
      console.log('\n⚠️ WARNING: Model codes not extracted properly:');
      noEngineType.slice(0, 5).forEach(m => console.log(`  - "${m.model}" (should have model code)`));
    }

    if (missingPrices.length > 0) {
      console.log(`\n💰 INFO: ${missingPrices.length} motors missing prices (normal for "Call for Price")`);
    }

    // Save filtered motors to database
    let savedMotors = 0
    if (cleanedMotors.length > 0) {
      console.log('💾 Attempting to save cleaned motors to database...')
      savedMotors = await saveMotorsToDatabase(cleanedMotors)
      console.log('💾 Saved motors to database:', savedMotors)
    }
    
    // Calculate totals for response
    const totalMotorsFound = allMotors.length
    const totalUniqueMotors = uniqueMotors.length
    const successfulPages = pageResults.filter(p => p.success).length
    
    // Generate motors per page breakdown
    const motorsPerPage = pageResults.map((result, index) => ({
      page: index + 1,
      motors_found: result.motors_found || 0
    }))

    // Get sample motors (first 3) for verification with harrisboatworks.ca format
    const sampleMotors = uniqueMotors.slice(0, 3).map(motor => ({
      make: motor.make,
      model: cleanMotorName(motor.model), // Clean display format: "2025 FourStroke 25HP EFI ELHPT"
      horsepower: motor.horsepower,
      motor_type: motor.motor_type,
      base_price: motor.base_price,
      sale_price: motor.sale_price,
      stock_number: motor.stock_number,
      availability: motor.availability,
      year: motor.year,
      model_code: motor.model_code || '', // CRITICAL: EH, ELHPT, XL, etc.
      fuel_type: motor.fuel_type || '',
      full_title: motor.full_title
    }))

    // Add defensive null checks for response variables
    const safeTotalMotorsFound = totalMotorsFound || 0;
    const safeTotalUniqueMotors = totalUniqueMotors || 0;
    const safeSavedMotors = savedMotors || 0;
    const safeSuccessfulPages = successfulPages || 0;
    const safeDetectedTotalPages = detectedTotalPages || 0;
    const safeTotalExpectedMotors = totalExpectedMotors || 0;
    const safeMotorsPerPage = motorsPerPage || 0;
    const safeSampleMotors = sampleMotors || [];
    const safePageResults = pageResults || [];
    const safeErrors = errors || [];

    const result = {
      success: true,
      message: `Enhanced Mercury-specific scrape completed! ${safeSuccessfulPages}/${Math.max(pages_to_scrape, safeDetectedTotalPages)} pages successful. Found ${safeTotalMotorsFound} total motors (${safeTotalUniqueMotors} unique), saved ${safeSavedMotors} to database`,
      total_pages_scraped: Math.max(pages_to_scrape, safeDetectedTotalPages),
      successful_pages: safeSuccessfulPages,
      failed_pages: Math.max(pages_to_scrape, safeDetectedTotalPages) - safeSuccessfulPages,
      combined_motors_found: safeTotalMotorsFound,
      combined_motors_saved: safeSavedMotors,
      expected_motors: safeTotalExpectedMotors,
      capture_rate: safeTotalExpectedMotors > 0 ? ((safeTotalUniqueMotors / safeTotalExpectedMotors) * 100).toFixed(1) + '%' : 'Unknown',
      deduplication_method: 'stock_number_enhanced',
      motors_per_page: safeMotorsPerPage,
      sample_motors: safeSampleMotors,
      page_results: safePageResults,
      errors: safeErrors,
      base_url: baseUrl || 'https://www.harrisboatworks.ca',
      api_version: 'v2-enhanced-mercury',
      timestamp: new Date().toISOString(),
      validation: {
        total_expected: safeTotalExpectedMotors,
        total_found: safeTotalMotorsFound,
        total_unique: safeTotalUniqueMotors,
        capture_success: safeTotalExpectedMotors > 0 ? safeTotalUniqueMotors >= (safeTotalExpectedMotors * 0.8) : true
      }
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (error) {
    console.error('❌ Main function error:', error)
    console.error('❌ Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, // Return 200 with error details in JSON
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})