// ! Protéger les routes (authentication, interval)

import { db } from "@/lib/db"
import { stories } from "@/lib/schema"
import { GraphData, StoryEdge, StoryNode, Trigger, Variable } from "@/types";
import { sanitizeGraphData } from "@/lib/sanitize";
import { eq } from "drizzle-orm"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // Retrieving story
        const story = db.select().from(stories).where(eq(stories.id, Number(id))).get();

        if (!story) return Response.json({ message: "The story does not exist" }, { status: 404 });

        // Sanitizing graph data (fix legacy conditions/assignments values)
        const graph = typeof story.graph === 'string'
            ? JSON.parse(story.graph)
            : story.graph;
        const sanitizedStory = {
            ...story,
            graph: sanitizeGraphData(graph)
        };
        return Response.json({ story: sanitizedStory });
    } catch {
        return Response.json({ message: "An error occured. Please try again." }, { status: 500 });
    }
}

type SaveInfo = {
    title: string,
    nodes: StoryNode[],
    edges: StoryEdge[],
    variables: Variable[],
    triggers: Trigger[]
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }>}) {
    const { id } = await params;

    try {
        // Retrieving info to update
        const { title, nodes, edges, variables, triggers }: SaveInfo = await req.json();
        if (!title) return Response.json({ message: "The title cannot be empty" }, { status: 400 });

        // Verifying story existance
        const data = db.select().from(stories).where(eq(stories.id, Number(id))).get();
        if (!data) return Response.json({ message: "The story does not exist." }, { status: 404 });

        // Updating
        if (variables.filter((variable) => variable.label === '' || variable.value === '').length > 0)
            return Response.json({ message: "One or more variables are invalid" }, { status: 400 });

        const graph: GraphData = sanitizeGraphData({ nodes, edges, variables, triggers });
        await db.update(stories).set({
            title,
            graph,
        }).where(eq(stories.id, Number(id)));

        return Response.json({})
    } catch {
        return Response.json({ message: "An error occured. Please try again." }, { status: 500 });
    }
}