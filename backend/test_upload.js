import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function test() {
    const formData = new FormData();
    // create a dummy png file
    const buf = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000B49444154789C6360000200000500010A9D87450000000049454E44AE426082', 'hex');
    fs.writeFileSync('test.png', buf);
    
    formData.append('file', fs.createReadStream('test.png'), {
        filename: 'test.png',
        contentType: 'image/png'
    });
    
    try {
        const response = await axios.post(
            'http://localhost:8000/generate-product-description-from-image',
            formData,
            {
                headers: { ...formData.getHeaders() }
            }
        );
        console.log("Success:", response.data);
    } catch (err) {
        if (err.response) {
            console.log("Error:", err.response.data);
        } else {
            console.log("Error:", err.message);
        }
    }
}
test();
