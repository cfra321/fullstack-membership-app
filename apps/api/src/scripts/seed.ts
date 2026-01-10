/**
 * Seed Script
 *
 * Seeds the Firestore database with sample articles and videos.
 * This script is meant to be run manually for development and testing.
 *
 * Usage: npm run seed
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { getDb, COLLECTIONS, initializeFirebase } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Sample article data (without timestamps).
 */
export interface SampleArticle {
  title: string;
  slug: string;
  preview: string;
  content: string;
  coverImage?: string;
  author: string;
}

/**
 * Sample video data (without timestamps).
 */
export interface SampleVideo {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  author: string;
}

/**
 * Validate that an article has all required fields.
 */
export function validateArticle(article: SampleArticle): boolean {
  return (
    typeof article.title === 'string' && article.title.length > 0 &&
    typeof article.slug === 'string' && article.slug.length > 0 &&
    typeof article.preview === 'string' && article.preview.length > 0 &&
    typeof article.content === 'string' && article.content.length > 0 &&
    typeof article.author === 'string' && article.author.length > 0
  );
}

/**
 * Validate that a video has all required fields.
 */
export function validateVideo(video: SampleVideo): boolean {
  return (
    typeof video.title === 'string' && video.title.length > 0 &&
    typeof video.slug === 'string' && video.slug.length > 0 &&
    typeof video.description === 'string' && video.description.length > 0 &&
    typeof video.thumbnail === 'string' && video.thumbnail.length > 0 &&
    typeof video.videoUrl === 'string' && video.videoUrl.length > 0 &&
    typeof video.duration === 'number' && video.duration > 0 &&
    typeof video.author === 'string' && video.author.length > 0
  );
}

/**
 * Sample articles for seeding the database.
 */
export const sampleArticles: SampleArticle[] = [
  {
    title: 'Getting Started with TypeScript',
    slug: 'getting-started-typescript',
    preview: 'Learn the fundamentals of TypeScript and how it can improve your JavaScript development experience.',
    content: `# Getting Started with TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

## Why TypeScript?

TypeScript adds optional static typing and class-based object-oriented programming to the language. This allows developers to:

- Catch errors early in development
- Improve code readability and maintainability
- Enable better IDE support with autocompletion
- Scale large codebases more effectively

## Installing TypeScript

To get started, install TypeScript globally:

\`\`\`bash
npm install -g typescript
\`\`\`

## Your First TypeScript File

Create a file called \`hello.ts\`:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\`

Compile it with:

\`\`\`bash
tsc hello.ts
\`\`\`

This will generate a \`hello.js\` file that you can run with Node.js.

## Conclusion

TypeScript provides powerful features that make JavaScript development more robust and scalable. Start incorporating it into your projects today!`,
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
    author: 'Sarah Chen',
  },
  {
    title: 'Building RESTful APIs with Express.js',
    slug: 'building-restful-apis-express',
    preview: 'A comprehensive guide to creating robust REST APIs using Express.js and Node.js.',
    content: `# Building RESTful APIs with Express.js

Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.

## Setting Up Your Project

First, create a new directory and initialize your project:

\`\`\`bash
mkdir my-api
cd my-api
npm init -y
npm install express
\`\`\`

## Creating Your First Endpoint

\`\`\`javascript
const express = require('express');
const app = express();

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
\`\`\`

## Best Practices

1. **Use proper HTTP methods** - GET for reading, POST for creating, PUT for updating, DELETE for removing
2. **Return appropriate status codes** - 200 for success, 404 for not found, 500 for server errors
3. **Validate input data** - Always validate and sanitize user input
4. **Use middleware** - Leverage Express middleware for common tasks

Express.js makes building APIs straightforward and enjoyable!`,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    author: 'Michael Roberts',
  },
  {
    title: 'Introduction to React Hooks',
    slug: 'introduction-react-hooks',
    preview: 'Discover how React Hooks can simplify your components and make your code more reusable.',
    content: `# Introduction to React Hooks

React Hooks were introduced in React 16.8 and have revolutionized how we write React components.

## What are Hooks?

Hooks are functions that let you "hook into" React state and lifecycle features from function components.

## useState Hook

The most commonly used hook is \`useState\`:

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

## useEffect Hook

For side effects like data fetching:

\`\`\`jsx
import { useState, useEffect } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}
\`\`\`

## Custom Hooks

You can create your own hooks to share logic:

\`\`\`jsx
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
\`\`\`

Hooks make functional components powerful and flexible!`,
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    author: 'Emily Johnson',
  },
  {
    title: 'Firebase Authentication Best Practices',
    slug: 'firebase-auth-best-practices',
    preview: 'Learn how to implement secure authentication in your applications using Firebase.',
    content: `# Firebase Authentication Best Practices

Firebase Authentication provides easy-to-use SDKs and ready-made UI libraries to authenticate users to your app.

## Setting Up Firebase Auth

First, install the Firebase SDK:

\`\`\`bash
npm install firebase
\`\`\`

Initialize Firebase in your app:

\`\`\`javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
\`\`\`

## Security Best Practices

1. **Always validate on the server** - Never trust client-side authentication alone
2. **Use security rules** - Implement proper Firestore security rules
3. **Enable email verification** - Require users to verify their email
4. **Implement rate limiting** - Prevent brute force attacks
5. **Use secure session management** - HttpOnly cookies for sensitive apps

## OAuth Integration

Firebase supports multiple OAuth providers:

- Google
- Facebook
- Twitter
- GitHub
- Apple

Implementing social login is straightforward and increases user conversion.`,
    coverImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800',
    author: 'David Park',
  },
  {
    title: 'CSS Grid Layout Mastery',
    slug: 'css-grid-layout-mastery',
    preview: 'Master CSS Grid to create complex, responsive layouts with ease.',
    content: `# CSS Grid Layout Mastery

CSS Grid is a powerful layout system that allows you to create complex, responsive web layouts.

## Basic Grid Setup

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 20px;
}
\`\`\`

## Grid Areas

Define named grid areas for complex layouts:

\`\`\`css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
\`\`\`

## Responsive Grid

Make your grid responsive without media queries:

\`\`\`css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
\`\`\`

## Alignment

CSS Grid provides powerful alignment options:

\`\`\`css
.container {
  display: grid;
  place-items: center; /* Centers both horizontally and vertically */
}
\`\`\`

CSS Grid is now supported in all modern browsers and is the go-to solution for complex layouts!`,
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    author: 'Lisa Wang',
  },
  {
    title: 'Understanding Async/Await in JavaScript',
    slug: 'understanding-async-await-javascript',
    preview: 'Simplify your asynchronous JavaScript code with async/await syntax.',
    content: `# Understanding Async/Await in JavaScript

Async/await is syntactic sugar built on top of Promises that makes asynchronous code easier to write and read.

## The Problem with Callbacks

Before Promises and async/await, we had callback hell:

\`\`\`javascript
getData(function(a) {
  getMoreData(a, function(b) {
    getEvenMoreData(b, function(c) {
      // Deeply nested callbacks
    });
  });
});
\`\`\`

## Async/Await Solution

\`\`\`javascript
async function fetchData() {
  const a = await getData();
  const b = await getMoreData(a);
  const c = await getEvenMoreData(b);
  return c;
}
\`\`\`

## Error Handling

Use try/catch for error handling:

\`\`\`javascript
async function fetchWithErrorHandling() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}
\`\`\`

## Parallel Execution

Run multiple async operations in parallel:

\`\`\`javascript
async function fetchAll() {
  const [users, posts, comments] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);

  return { users, posts, comments };
}
\`\`\`

Async/await makes asynchronous code much more readable and maintainable!`,
    coverImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800',
    author: 'James Wilson',
  },
  {
    title: 'Next.js 14 App Router Deep Dive',
    slug: 'nextjs-14-app-router-deep-dive',
    preview: 'Explore the new App Router in Next.js 14 and learn how to build modern web applications.',
    content: `# Next.js 14 App Router Deep Dive

Next.js 14 introduces significant improvements to the App Router, making it the recommended way to build React applications.

## File-based Routing

Create routes by adding files to the \`app\` directory:

\`\`\`
app/
  page.tsx         // /
  about/
    page.tsx       // /about
  blog/
    [slug]/
      page.tsx     // /blog/:slug
\`\`\`

## Server Components

By default, components in the app directory are Server Components:

\`\`\`tsx
// This runs on the server
async function BlogPost({ params }) {
  const post = await db.posts.find(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
\`\`\`

## Client Components

Add 'use client' directive for interactive components:

\`\`\`tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

## Layouts

Share UI between routes with layouts:

\`\`\`tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <nav>...</nav>
        {children}
        <footer>...</footer>
      </body>
    </html>
  );
}
\`\`\`

The App Router provides excellent performance and developer experience!`,
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    author: 'Alex Thompson',
  },
  {
    title: 'Tailwind CSS Tips and Tricks',
    slug: 'tailwind-css-tips-tricks',
    preview: 'Level up your Tailwind CSS skills with these professional tips and tricks.',
    content: `# Tailwind CSS Tips and Tricks

Tailwind CSS is a utility-first CSS framework that lets you build designs directly in your markup.

## Custom Configuration

Extend Tailwind with your design system:

\`\`\`javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}
\`\`\`

## Component Extraction

Use @apply for repeated patterns:

\`\`\`css
.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg
         hover:bg-blue-700 transition-colors;
}
\`\`\`

## Responsive Design

Mobile-first responsive utilities:

\`\`\`html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Cards stack on mobile, 2 columns on tablet, 3 on desktop -->
</div>
\`\`\`

## Dark Mode

Enable dark mode support:

\`\`\`html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <!-- Content that adapts to color scheme -->
</div>
\`\`\`

## Animation Utilities

Add smooth animations:

\`\`\`html
<button class="transition-all duration-300 hover:scale-105 hover:shadow-lg">
  Hover me
</button>
\`\`\`

Tailwind CSS accelerates development while maintaining design consistency!`,
    coverImage: 'https://images.unsplash.com/photo-1517134191118-9d595e4c8c2b?w=800',
    author: 'Sophie Martinez',
  },
  {
    title: 'Database Design Fundamentals',
    slug: 'database-design-fundamentals',
    preview: 'Learn the core principles of database design for scalable applications.',
    content: `# Database Design Fundamentals

Good database design is crucial for building scalable and maintainable applications.

## Normalization

Organize data to reduce redundancy:

### First Normal Form (1NF)
- Eliminate repeating groups
- Create a separate table for each set of related data

### Second Normal Form (2NF)
- Meet 1NF requirements
- Remove partial dependencies

### Third Normal Form (3NF)
- Meet 2NF requirements
- Remove transitive dependencies

## Indexing Strategies

\`\`\`sql
-- Create an index for frequently queried columns
CREATE INDEX idx_users_email ON users(email);

-- Composite index for multi-column queries
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
\`\`\`

## NoSQL Considerations

For document databases like Firestore:

- **Denormalization** - Duplicate data for read efficiency
- **Subcollections** - Organize related data hierarchically
- **Aggregation** - Pre-compute counts and summaries

## Query Optimization

1. Use indexes for frequent queries
2. Limit result sets with pagination
3. Avoid SELECT * in production
4. Use query analysis tools

Good database design pays dividends throughout the application lifecycle!`,
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    author: 'Robert Kim',
  },
  {
    title: 'Web Security Essentials',
    slug: 'web-security-essentials',
    preview: 'Protect your web applications from common security vulnerabilities.',
    content: `# Web Security Essentials

Security should be a primary concern when building web applications.

## OWASP Top 10

The most critical security risks:

1. **Injection** - SQL, NoSQL, command injection
2. **Broken Authentication** - Session management flaws
3. **XSS** - Cross-site scripting
4. **Insecure Direct Object References**
5. **Security Misconfiguration**

## Preventing XSS

Always sanitize user input:

\`\`\`javascript
// Use libraries like DOMPurify
import DOMPurify from 'dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);
\`\`\`

## CSRF Protection

Implement CSRF tokens:

\`\`\`javascript
// Generate token
const csrfToken = crypto.randomBytes(32).toString('hex');

// Verify on each request
if (req.body.csrfToken !== session.csrfToken) {
  throw new Error('CSRF token mismatch');
}
\`\`\`

## Secure Headers

Set security headers:

\`\`\`javascript
app.use(helmet({
  contentSecurityPolicy: true,
  xssFilter: true,
  noSniff: true,
  hsts: { maxAge: 31536000 }
}));
\`\`\`

## Password Storage

Never store plain text passwords:

\`\`\`javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;

const hash = await bcrypt.hash(password, saltRounds);
const isValid = await bcrypt.compare(password, hash);
\`\`\`

Security is an ongoing process, not a one-time implementation!`,
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    author: 'Maria Garcia',
  },
  {
    title: 'Testing React Applications',
    slug: 'testing-react-applications',
    preview: 'Write comprehensive tests for your React applications using modern testing libraries.',
    content: `# Testing React Applications

Testing ensures your React applications work correctly and helps prevent regressions.

## Setup with Jest and Testing Library

\`\`\`bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
\`\`\`

## Component Testing

\`\`\`jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Counter from './Counter';

test('increments counter on click', () => {
  render(<Counter />);

  const button = screen.getByRole('button', { name: /increment/i });
  fireEvent.click(button);

  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
});
\`\`\`

## Async Testing

\`\`\`jsx
import { render, screen, waitFor } from '@testing-library/react';

test('loads and displays data', async () => {
  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText(/loaded data/i)).toBeInTheDocument();
  });
});
\`\`\`

## Mocking

\`\`\`javascript
jest.mock('./api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ name: 'Test' }))
}));
\`\`\`

## Best Practices

1. Test behavior, not implementation
2. Use meaningful assertions
3. Keep tests focused and independent
4. Mock external dependencies
5. Aim for good coverage, not 100%

Testing builds confidence in your codebase!`,
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    author: 'Chris Anderson',
  },
  {
    title: 'Git Workflow for Teams',
    slug: 'git-workflow-teams',
    preview: 'Establish effective Git workflows for collaborative development teams.',
    content: `# Git Workflow for Teams

A good Git workflow is essential for team productivity and code quality.

## Feature Branch Workflow

\`\`\`bash
# Create feature branch
git checkout -b feature/user-authentication

# Make changes and commit
git add .
git commit -m "Add login form component"

# Push and create PR
git push origin feature/user-authentication
\`\`\`

## Commit Messages

Follow conventional commits:

\`\`\`
feat: add user authentication
fix: resolve login redirect bug
docs: update API documentation
refactor: extract validation logic
test: add unit tests for auth service
\`\`\`

## Code Review Process

1. **Small PRs** - Keep changes focused
2. **Clear descriptions** - Explain what and why
3. **Request reviews** - Get feedback from peers
4. **Address comments** - Respond thoughtfully
5. **Squash and merge** - Keep history clean

## Branch Protection

Configure branch rules:

- Require PR reviews
- Require status checks
- Prevent force pushes
- Require linear history

## Rebasing vs Merging

Use rebase for feature branches:

\`\`\`bash
git checkout feature/my-feature
git rebase main
git push --force-with-lease
\`\`\`

A consistent workflow reduces conflicts and improves collaboration!`,
    coverImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800',
    author: 'Daniel Lee',
  },
];

/**
 * Sample videos for seeding the database.
 */
export const sampleVideos: SampleVideo[] = [
  {
    title: 'TypeScript Crash Course',
    slug: 'typescript-crash-course',
    description: 'Learn TypeScript fundamentals in this comprehensive crash course. Perfect for JavaScript developers looking to level up.',
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
    videoUrl: 'https://sample-videos.com/typescript-crash-course.mp4',
    duration: 2700, // 45 minutes
    author: 'Sarah Chen',
  },
  {
    title: 'Building a REST API from Scratch',
    slug: 'building-rest-api-scratch',
    description: 'Step-by-step tutorial on building a production-ready REST API with Node.js and Express.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
    videoUrl: 'https://sample-videos.com/rest-api-tutorial.mp4',
    duration: 3600, // 60 minutes
    author: 'Michael Roberts',
  },
  {
    title: 'React Hooks Explained',
    slug: 'react-hooks-explained',
    description: 'Deep dive into React Hooks including useState, useEffect, useContext, and custom hooks.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    videoUrl: 'https://sample-videos.com/react-hooks.mp4',
    duration: 2400, // 40 minutes
    author: 'Emily Johnson',
  },
  {
    title: 'Firebase Setup and Configuration',
    slug: 'firebase-setup-configuration',
    description: 'Complete guide to setting up Firebase for your web applications including authentication and Firestore.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400',
    videoUrl: 'https://sample-videos.com/firebase-setup.mp4',
    duration: 1800, // 30 minutes
    author: 'David Park',
  },
  {
    title: 'CSS Grid Masterclass',
    slug: 'css-grid-masterclass',
    description: 'Master CSS Grid layout with practical examples and real-world projects.',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    videoUrl: 'https://sample-videos.com/css-grid-masterclass.mp4',
    duration: 3000, // 50 minutes
    author: 'Lisa Wang',
  },
  {
    title: 'JavaScript Promises Deep Dive',
    slug: 'javascript-promises-deep-dive',
    description: 'Understand JavaScript Promises, async/await, and error handling patterns.',
    thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400',
    videoUrl: 'https://sample-videos.com/promises-deep-dive.mp4',
    duration: 2100, // 35 minutes
    author: 'James Wilson',
  },
  {
    title: 'Next.js 14 Tutorial',
    slug: 'nextjs-14-tutorial',
    description: 'Build a full-stack application with Next.js 14, including the new App Router and Server Components.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    videoUrl: 'https://sample-videos.com/nextjs-14-tutorial.mp4',
    duration: 4200, // 70 minutes
    author: 'Alex Thompson',
  },
  {
    title: 'Tailwind CSS Workflow',
    slug: 'tailwind-css-workflow',
    description: 'Efficient Tailwind CSS workflow for building modern user interfaces quickly.',
    thumbnail: 'https://images.unsplash.com/photo-1517134191118-9d595e4c8c2b?w=400',
    videoUrl: 'https://sample-videos.com/tailwind-workflow.mp4',
    duration: 1500, // 25 minutes
    author: 'Sophie Martinez',
  },
  {
    title: 'Database Design Patterns',
    slug: 'database-design-patterns',
    description: 'Learn essential database design patterns for both SQL and NoSQL databases.',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400',
    videoUrl: 'https://sample-videos.com/database-patterns.mp4',
    duration: 2700, // 45 minutes
    author: 'Robert Kim',
  },
  {
    title: 'Web Security Fundamentals',
    slug: 'web-security-fundamentals',
    description: 'Essential security practices every web developer should know.',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
    videoUrl: 'https://sample-videos.com/web-security.mp4',
    duration: 3300, // 55 minutes
    author: 'Maria Garcia',
  },
  {
    title: 'Testing React Components',
    slug: 'testing-react-components',
    description: 'Comprehensive guide to testing React components with Jest and Testing Library.',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    videoUrl: 'https://sample-videos.com/testing-react.mp4',
    duration: 2400, // 40 minutes
    author: 'Chris Anderson',
  },
  {
    title: 'Git for Teams',
    slug: 'git-for-teams',
    description: 'Best practices for using Git in team environments, including branching strategies and code review.',
    thumbnail: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400',
    videoUrl: 'https://sample-videos.com/git-for-teams.mp4',
    duration: 1800, // 30 minutes
    author: 'Daniel Lee',
  },
];

/**
 * Seed articles to Firestore.
 */
async function seedArticles(): Promise<void> {
  const db = getDb();
  const articlesCollection = db.collection(COLLECTIONS.ARTICLES);

  console.log(`Seeding ${sampleArticles.length} articles...`);

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const article of sampleArticles) {
    if (!validateArticle(article)) {
      console.warn(`Skipping invalid article: ${article.title}`);
      continue;
    }

    const docRef = articlesCollection.doc();
    batch.set(docRef, {
      ...article,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log('Articles seeded successfully!');
}

/**
 * Seed videos to Firestore.
 */
async function seedVideos(): Promise<void> {
  const db = getDb();
  const videosCollection = db.collection(COLLECTIONS.VIDEOS);

  console.log(`Seeding ${sampleVideos.length} videos...`);

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const video of sampleVideos) {
    if (!validateVideo(video)) {
      console.warn(`Skipping invalid video: ${video.title}`);
      continue;
    }

    const docRef = videosCollection.doc();
    batch.set(docRef, {
      ...video,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log('Videos seeded successfully!');
}

/**
 * Clear existing content from Firestore.
 */
async function clearContent(): Promise<void> {
  const db = getDb();

  console.log('Clearing existing content...');

  // Clear articles
  const articlesSnapshot = await db.collection(COLLECTIONS.ARTICLES).get();
  const articlesBatch = db.batch();
  articlesSnapshot.docs.forEach((doc) => articlesBatch.delete(doc.ref));
  await articlesBatch.commit();
  console.log(`Deleted ${articlesSnapshot.size} articles`);

  // Clear videos
  const videosSnapshot = await db.collection(COLLECTIONS.VIDEOS).get();
  const videosBatch = db.batch();
  videosSnapshot.docs.forEach((doc) => videosBatch.delete(doc.ref));
  await videosBatch.commit();
  console.log(`Deleted ${videosSnapshot.size} videos`);
}

/**
 * Main seed function.
 */
async function seed(): Promise<void> {
  console.log('Starting database seed...\n');

  try {
    // Initialize Firebase
    initializeFirebase();

    // Clear existing content
    await clearContent();

    // Seed new content
    await seedArticles();
    await seedVideos();

    console.log('\nDatabase seeding completed successfully!');
    console.log(`  - ${sampleArticles.length} articles`);
    console.log(`  - ${sampleVideos.length} videos`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seed().then(() => process.exit(0));
}

export { seed, seedArticles, seedVideos, clearContent };
