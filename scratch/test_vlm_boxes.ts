import fs from 'fs';
import path from 'path';

const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  });
}

import { analyzeProductPackagingWithVlm } from '../lib/gemini';

async function testVlmBoundingBoxes() {
  const sampleImagePath = path.join(__dirname, '..', 'public', 'uploads', 'img_1788699173397_1.jpeg');
  if (!fs.existsSync(sampleImagePath)) {
    console.error('Sample image not found at', sampleImagePath);
    return;
  }

  const imageBuffer = fs.readFileSync(sampleImagePath);
  const base64Data = imageBuffer.toString('base64');

  console.log('Sending sample image to Gemini VLM for bounding box extraction...');
  const result = await analyzeProductPackagingWithVlm([
    {
      data: base64Data,
      mimeType: 'image/jpeg',
      sourceLabel: 'image-1'
    }
  ]);

  console.log('=== VLM Analysis Succeeded! ===');
  console.log('Product Name:', result.extractedData.product_name);
  console.log('MRP:', result.extractedData.mrp);
  console.log('Net Quantity:', result.extractedData.net_quantity);
  console.log('Manufacturer:', result.extractedData.manufacturer_name);
  console.log('Mfg Date:', result.extractedData.date_of_manufacture);

  console.log('\n--- Detected Bounding Boxes ---');
  let boxCount = 0;
  for (const [key, field] of Object.entries(result.extractedData)) {
    if (field && typeof field === 'object' && 'boundingBox' in field && field.boundingBox) {
      boxCount++;
      console.log(`[${key}]:`, field.boundingBox, `(val: "${field.value}")`);
    }
  }
  console.log(`Total fields with bounding boxes: ${boxCount}`);
}

testVlmBoundingBoxes().catch((err) => {
  console.error('Error during VLM testing:', err);
});
