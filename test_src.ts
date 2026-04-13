import fs from 'fs';

const imagePath = '/home/kz/Desktop/el-badran-project/image_processing_backend/image.jpg';
const imageBuffer = fs.readFileSync(imagePath);
const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });

const formData = new FormData();
formData.append('image', imageBlob, 'image.jpg');

const response = await fetch('http://localhost:3000/api/search', {
    method: 'POST',
    body: formData
});

const data = await response.json();
console.log(data);

// By having an import statement at the top, TypeScript understands this file is a module,
// which automatically fixes the "top-level await" error!
export {};
