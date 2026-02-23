import { NextResponse } from "next/server";
import { db } from "@/app/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { query, where, getDocs } from "firebase/firestore";
import { deleteDoc, doc } from "firebase/firestore";
import { updateDoc } from "firebase/firestore";


export async function POST(req) {
  try {
    const body = await req.json();

    const { title, description, dueDate, ownerId, assignedTo } = body;

    if (!title || title.length < 3)
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });

    if (!description)
      return NextResponse.json({ error: "Description required" }, { status: 400 });

    if (!dueDate || new Date(dueDate) <= new Date())
      return NextResponse.json({ error: "Due date must be future" }, { status: 400 });

    const newTask = await addDoc(collection(db, "tasks"), {
      title,
      description,
      status: "todo",
      dueDate: new Date(dueDate),
      ownerId,
      assignedTo: assignedTo || null,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ id: newTask.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const role = searchParams.get("role");

    const tasksRef = collection(db, "tasks");

    let tasks = [];

    if (role === "admin") {
      const snapshot = await getDocs(tasksRef);
      tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Query owner tasks
      const ownerQuery = query(tasksRef, where("ownerId", "==", uid));
      const ownerSnap = await getDocs(ownerQuery);

      // Query assigned tasks
      const assignedQuery = query(tasksRef, where("assignedTo", "==", uid));
      const assignedSnap = await getDocs(assignedQuery);

      const combined = [
        ...ownerSnap.docs,
        ...assignedSnap.docs,
      ];

      // Remove duplicates (if owner === assigned)
      const unique = {};
      combined.forEach(doc => {
        unique[doc.id] = { id: doc.id, ...doc.data() };
      });

      tasks = Object.values(unique);
    }

    return NextResponse.json(tasks);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();

    await deleteDoc(doc(db, "tasks", id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, status } = await req.json();

    await updateDoc(doc(db, "tasks", id), { status });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}