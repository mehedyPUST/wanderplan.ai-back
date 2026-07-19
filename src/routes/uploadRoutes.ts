// import { Router, Request, Response } from "express";
// import multer from "multer";

// const upload = multer({ storage: multer.memoryStorage() });
// const router = Router();

// router.post("/", upload.single("image"), async (req: Request, res: Response) => {
//     try {
//         if (!req.file) return res.status(400).json({ message: "No file" });
//         const base64 = req.file.buffer.toString("base64");
//         const formData = new FormData();
//         formData.append("image", base64);
//         const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
//             method: "POST",
//             body: formData,
//         });
//         const data = await response.json();
//         res.json({ url: data.data.url });
//     } catch {
//         res.status(500).json({ message: "Upload failed" });
//     }
// });

// export default router;

import { Router, Request, Response } from "express";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/", upload.single("image"), async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file" });
        const base64 = req.file.buffer.toString("base64");
        const formData = new FormData();
        formData.append("image", base64);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
            method: "POST",
            body: formData,
        });
        const data: any = await response.json();
        if (!data.success) return res.status(400).json({ message: "Upload failed" });
        res.json({ url: data.data.url });
    } catch {
        res.status(500).json({ message: "Upload failed" });
    }
});

export default router;