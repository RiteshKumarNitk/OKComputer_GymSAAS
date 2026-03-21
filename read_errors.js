const fs = require('fs');
const file = 'c:/Users/RITESH/Downloads/OKComputer_GymSAAS/build_errors.txt';
if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf16le');
    console.log(content);
} else {
    console.log("File not found");
}
