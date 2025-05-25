import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = join(process.cwd(), 'public', 'uploads');
mkdir(uploadDir, { recursive: true }).catch(console.error);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        const filepath = join(uploadDir, filename);

        // Write file to disk
        await writeFile(filepath, buffer);

        // Return file URL
        const fileUrl = `/uploads/${filename}`;
        return NextResponse.json({ url: fileUrl });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json(
                { error: 'No filename provided' },
                { status: 400 }
            );
        }

        const filepath = join(uploadDir, filename);

        if (!existsSync(filepath)) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        const fileBuffer = await readFile(filepath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        console.error('Error downloading file:', error);
        return NextResponse.json(
            { error: 'Failed to download file' },
            { status: 500 }
        );
    }
} 