const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { exec } = require('child_process');
const { Storage } = require('@google-cloud/storage');
const pdfplumber = require('pdfplumber');
const path = require('path');
const os = require('os');
const fs = require('fs');

admin.initializeApp();
const storage = new Storage();

exports.scrapeDocument = functions.https.onRequest((req, res) => {
    const url = req.query.url;
    exec(`python document_scraper.py ${url}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send(error);
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        res.send("Document scraped and saved to Firestore");
    });
});

exports.processPDF = functions.storage.object().onFinalize(async (object) => {
    const bucket = storage.bucket(object.bucket);
    const filePath = object.name;
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    await bucket.file(filePath).download({ destination: tempFilePath });

    let documentText = '';
    const pdf = await pdfplumber.open(tempFilePath);
    for (const page of pdf.pages) {
        documentText += page.extract_text();
    }
    pdf.close();

    const db = admin.firestore();
    await db.collection('documents').add({ content: documentText });

    fs.unlinkSync(tempFilePath);
});