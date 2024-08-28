// import { Hono } from "hono";
// import { db } from "./db";

// const PORT = process.env.PORT || 3000;

// const app = new Hono();

// app.get("/", async (c) => {
// 	try {
// 		const data = await db.query.posts.findMany({
// 			with: {
// 				comments: true,
// 				user: true,
// 			},
// 		});
// 		return c.json({
// 			data,
// 		});
// 	} catch (error) {
// 		return c.json({ error });
// 	}
// });

// Bun.serve({
// 	port: PORT,
// 	fetch: app.fetch,
// });

// if (process.env.NODE_ENV === "development") {
// 	console.log(`Server is running at http://localhost:${PORT}`);
// }
// 原始程序，修改前
import { Hono } from "hono";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { cors } from "hono/cors";
import { users, posts, comments } from "./db/schema";

const PORT = process.env.PORT || 5000;

const app = new Hono();

// 添加 CORS 中间件
app.use('/*', cors({
	origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // 允许的前端源
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的 HTTP 方法
	allowHeaders: ['Content-Type', 'Authorization'], // 允许的头部
	exposeHeaders: ['Content-Length'],
	maxAge: 600,
	credentials: true, // 允许发送认证信息（如 cookies）
  }));


// Users CRUD
app.get("/users", async (c) => {
  try {
    const allUsers = await db.select().from(users);
    return c.json(allUsers);
  } catch (error) {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

app.post("/users", async (c) => {
  try {
    const body = await c.req.json();
    const newUser = await db.insert(users).values(body).returning();
    return c.json(newUser[0], 201);
  } catch (error) {
    return c.json({ error: "Failed to create user" }, 500);
  }
});

app.put("/users/:id", async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const updatedUser = await db.update(users).set(body).where(eq(users.id, Number(id))).returning();
    return c.json(updatedUser[0]);
  } catch (error) {
    return c.json({ error: "Failed to update user" }, 500);
  }
});

app.delete("/users/:id", async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(users).where(eq(users.id, Number(id)));
    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

// Posts CRUD
app.get("/posts", async (c) => {
	try {
	  const allPosts = await db.query.posts.findMany({
		with: {
		  comments: true,
		  user: true,
		},
	  });
	  console.log('Fetched posts:', allPosts);
	  return c.json(allPosts);
	} catch (error) {
	  console.error('Failed to fetch posts:', error);
	  return c.json({ error: "Failed to fetch posts" }, 500);
	}
  });
  // Update the POST /posts route
app.post("/posts", async (c) => {
  try {
    const body = await c.req.json();
    console.log('Received POST request body:', body);
    const now = new Date();
    const newPost = await db.insert(posts).values({
      ...body,
      createdAt: now,
      updatedAt: now
    }).returning();
    console.log('Created new post:', newPost);
    return c.json(newPost[0], 201);
  } catch (error) {
    console.error('Failed to create post:', error);
    return c.json({ error: "Failed to create post" }, 500);
  }
});

// Update the PUT /posts/:id route
app.put("/posts/:id", async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    console.log(`Received PUT request for post ${id}:`, body);
    const now = new Date();
    const updatedPost = await db.update(posts)
      .set({
        ...body,
        updatedAt: now
      })
      .where(eq(posts.id, Number(id)))
      .returning();
    console.log('Updated post:', updatedPost);
    return c.json(updatedPost[0]);
  } catch (error) {
    console.error('Failed to update post:', error);
    return c.json({ error: "Failed to update post" }, 500);
  }
});

  
app.delete("/posts/:id", async (c) => {
  const id = c.req.param('id');
  try {
    console.log(`Received DELETE request for post ${id}`);
    
    // 首先删除相关的评论
    const deletedComments = await db.delete(comments).where(eq(comments.postId, Number(id))).returning();
    console.log(`Deleted ${deletedComments.length} comments for post ${id}`);

    // 然后删除帖子
    const deletedPost = await db.delete(posts).where(eq(posts.id, Number(id))).returning();
    
    if (deletedPost.length === 0) {
      return c.json({ error: "Post not found" }, 404);
    }
    
    console.log(`Deleted post ${id}`);
    return c.json({ message: "Post and related comments deleted successfully" });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return c.json({ error: "Failed to delete post" }, 500);
  }
});

// Comments CRUD
app.get("/comments", async (c) => {
  try {
    const allComments = await db.query.comments.findMany({
      with: {
        post: true,
        user: true,
      },
    });
    return c.json(allComments);
  } catch (error) {
    return c.json({ error: "Failed to fetch comments" }, 500);
  }
});

app.post("/comments", async (c) => {
  try {
    const body = await c.req.json();
    const newComment = await db.insert(comments).values(body).returning();
    return c.json(newComment[0], 201);
  } catch (error) {
    return c.json({ error: "Failed to create comment" }, 500);
  }
});

app.put("/comments/:id", async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const updatedComment = await db.update(comments).set(body).where(eq(comments.id, Number(id))).returning();
    return c.json(updatedComment[0]);
  } catch (error) {
    return c.json({ error: "Failed to update comment" }, 500);
  }
});

app.delete("/comments/:id", async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(comments).where(eq(comments.id, Number(id)));
    return c.json({ message: "Comment deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete comment" }, 500);
  }
});

Bun.serve({
  port: PORT,
  fetch: app.fetch,
});

if (process.env.NODE_ENV === "development") {
  console.log(`Server is running at http://localhost:${PORT}`);
}