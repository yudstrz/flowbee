import { NextResponse } from 'next/server';
import { db } from '@/lib/turso';

// GET all surveys
export async function GET() {
  try {
    const res = await db.execute("SELECT * FROM surveys ORDER BY published_at DESC");
    const surveys = res.rows.map(r => ({
      id: r.id, title: r.title, url: r.url, publishedAt: r.published_at, status: r.status
    }));
    return NextResponse.json({ surveys });
  } catch (error) {
    console.error("Fetch Surveys Error:", error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

// POST create survey
export async function POST(request: Request) {
  try {
    const { title, url } = await request.json();
    if (!title || !url) return NextResponse.json({ error: 'Missing title or url' }, { status: 400 });

    await db.execute({
      sql: "INSERT INTO surveys (title, url, published_at, status) VALUES (?, ?, ?, 'active')",
      args: [title, url, new Date().toISOString()]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create Survey Error:", error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}

// PUT update survey
export async function PUT(request: Request) {
  try {
    const { id, title, url, status } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await db.execute({
      sql: "UPDATE surveys SET title = ?, url = ?, status = ? WHERE id = ?",
      args: [title, url, status, id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Survey Error:", error);
    return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 });
  }
}

// DELETE survey
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await db.execute({
      sql: "DELETE FROM surveys WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Survey Error:", error);
    return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 });
  }
}
