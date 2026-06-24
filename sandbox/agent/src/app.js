import express from 'express'
import morgan from 'morgan'
import fs, { read } from 'fs'
import path from 'path'

const WORK_DIR = "/workspace"
const app = express()

app.use(morgan("dev"))

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.get('/health', (req, res) => {
    res.status(200).json({
        message: "Ok"
    })
})

/**
 * @route GET /list-files
 * @desc List all files in the working directory and return a JSON response with the list of files
 
 */
app.get('/list-files', async (req, res) => {
    const listFiles = async (dir, baseDir) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const files = []
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);

            if (entry.isDirectory()) {
                if (['node_modules', '.git', 'dist'].includes(entry.name)) {
                    continue; // Skip these folders
                }
                // ✅ Folder ke andar recursively jao
                const subFiles = await listFiles(fullPath, baseDir)
                files.push(...subFiles)
            } else {
                // ✅ Sirf files push karo, folders nahi
                files.push(relativePath);
            }
        }
        return files;
    }

    try {
        const files = await listFiles(WORK_DIR, WORK_DIR)
        res.status(200).json({
            message: "List of files",
            files
        })
    } catch (err) {
        res.status(500).json({
            message: "Error listing files",
            error: err.message
        })
    }
})
/** 
 * @route GET /read-files
 * @desc Read the content of specified files in the working directory and return a JSON response with the file contents
 */

app.get("/read-files", async (req, res) => {

    const files = req.query.files;

    if (!files) {
        return res.status(400).json({
            message: 'No files specified in query parameter',
            status: 'error',
        });
    }

    const fileList = files.split(',');

    const results = await Promise.all(fileList.map(async (file) => {
        const filePath = path.join(WORK_DIR, file);
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return {
                [ filePath.replace(WORK_DIR, '') ]: content,
            }
        } catch (err) {
            return {
                [ filePath.replace(WORK_DIR, '') ]: `Error reading file: ${err.message}`,
            }
        }
    }));

    res.status(200).json({
        message: 'File contents',
        files: results,
    });

})


/**
 * @route PATCH /update-file
 * @desc Update the content of a file in the working directory with the provided content
 */

app.patch('/update-file', async (req, res) => {
    const updates = req.body.updates
    if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({
            message: "Please provide updates in the request body",
            status: 'error'
        })
    }

    const results = await Promise.all(updates.map(async (update) => {
        const { file, content } = update
        const filePath = path.join(WORK_DIR, file)  // ✅ Fix 1: double slash gone
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true })  // ✅ Fix 2: folder bana dega
            await fs.promises.writeFile(filePath, content, 'utf-8')
            return { [file]: "Updated successfully" }
        }
        catch (err) {
            return { [file]: `Error updating file: ${err.message}` }
        }
    }))

    res.status(200).json({
        message: "File updates",
        results
    })
})

/**
 * @route POST /create-file
 * @desc Create a new file in the working directory with the provided content
 */

app.post('/create-file', async (req, res) => {
    const { files } = req.body  // ✅ Bug 1 fix

    if (!files || !Array.isArray(files)) {  // ✅ Bug 2 fix
        return res.status(400).json({
            message: "Please provide file name and content in the request body",
            status: 'error'
        })
    }

    const results = await Promise.all(files.map(async (fileObj) => {  // ✅ Bug 3 fix
        const { file, content } = fileObj
        const filePath = path.join(WORK_DIR, file)
        try {
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
            await fs.promises.writeFile(filePath, content, 'utf-8')
            return { [filePath]: "Created successfully" }
        } catch (err) {
            return { [filePath]: `Error creating file: ${err.message}` }
        }
    }))

    res.status(200).json({
        message: "File creations",
        results
    })
})


export default app