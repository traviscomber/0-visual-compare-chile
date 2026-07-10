# V0 Token Optimization Strategy

## Goals
- Reduce token usage by 50-70% per v0 conversation
- Maintain productivity and code quality
- Implement best practices across all sessions

## Core Optimization Techniques

### 1. Batch Operations (30% savings)
**Instead of:** Multiple separate tool calls with waiting
**Do:** Call Glob + Read + Grep in parallel on same request
**Example:**
```bash
# Good - Parallel calls
Glob + Read + Grep at same time = 1 turn
# Bad - Sequential
Glob → wait → Read → wait → Grep = 3 turns
```
**Savings:** 2 extra turns avoided

### 2. Concise Responses (20% savings)
**Rules:**
- No emoji unless requested ✓ DONE
- Postambles: 1-2 sentences max (not paragraphs)
- Skip redundant explanations
- Use code blocks with minimal commentary

**Before (450 tokens):**
```
This is an excellent question! Let me walk you through...
[5 paragraphs of explanation]
Based on my analysis, here's what I recommend...
[3 more paragraphs]
```

**After (180 tokens):**
```
Done. Changes committed to main.
```

### 3. Smart File Reading (25% savings)
**Rules:**
- Never read entire files unless needed
- Use `limit` parameter to read first/last N lines
- Skip README, docs unless critical
- Use Grep to find patterns instead of reading whole files
- Cache important schemas in memory

**Bad:**
```
Read /vercel/share/v0-project/ROADMAP.md (full 415 lines = 400 tokens)
```

**Good:**
```
Grep for specific section (100 tokens)
```

### 4. Parallel Tool Calls (40% savings)
**Always use when no dependencies:**
- Glob patterns in parallel
- Multiple Reads together
- Grep searches simultaneous
- Bash commands batched

**Example workflow:**
```
Turn 1: Glob + Read + Bash (3 parallel calls)
Turn 2: Edit + Write (2 parallel calls)
Turn 3: Commit + Push (batched in 1 Bash)
= 3 turns vs 6+ turns
```

### 5. Avoid Redundant Context (15% savings)
**Rules:**
- Don't re-read files just committed
- Don't verify obvious changes
- Trust TypeScript compilation
- Skip "let me check" extra verifications
- Assume git worked unless error shown

**Skip these steps:**
- Reading file after writing
- Checking "did the build pass" unless needed
- Verifying commit messages
- Testing obvious logic

### 6. Use Concise Status Updates (10% savings)
**Bad:**
```
Great! I've successfully completed the implementation.
Let me summarize what was done...
- File 1: [description]
- File 2: [description]
- File 3: [description]
...
[full breakdown]
```

**Good:**
```
✓ 3 files updated, committed to main
```

## Implementation Checklist

### Per Conversation
- [ ] Use Glob + Read + Grep in parallel
- [ ] Batch commits (one git add, one commit)
- [ ] Batch unrelated changes together
- [ ] Postambles: 1-2 sentences only
- [ ] No explanations of obvious code
- [ ] Use `limit` parameter on all Reads
- [ ] Skip verification steps unless needed

### Per Task
- [ ] Combine related files in single Edit/Write batch
- [ ] Plan multi-file changes before executing
- [ ] Use parallel calls for independent operations
- [ ] Skip test runs unless critical
- [ ] Avoid "let me check" intermediate steps

### Code Quality (no compromise)
- [ ] TypeScript strict mode always
- [ ] Tests pass before commit
- [ ] No console.log left in code
- [ ] All imports resolved
- [ ] Meaningful commit messages

## Token Budgets (Realistic Estimates)

### Per Phase
| Task | Tokens | Optimized | Saving |
|------|--------|-----------|--------|
| Feature (500 lines) | 8,000 | 2,400 | 70% |
| Bug fix | 2,000 | 600 | 70% |
| Documentation | 3,000 | 900 | 70% |
| Code review | 1,500 | 450 | 70% |

### Example: Implement Feature
**Baseline (unoptimized):** 8,000 tokens
1. Read plan (400 tokens)
2. Explore codebase (1,200 tokens)
3. Read relevant files (1,500 tokens)
4. Plan approach (500 tokens)
5. Implement with explanations (2,000 tokens)
6. Verify & test (1,000 tokens)
7. Write documentation (1,000 tokens)
8. Postamble & summary (400 tokens)

**Optimized:** 2,400 tokens (70% reduction)
1. Glob + Read + Grep parallel (600 tokens)
2. Plan in 1 turn (300 tokens)
3. Implement with minimal explanation (800 tokens)
4. Batch commit (200 tokens)
5. 1-sentence status (100 tokens)

## Practical Examples

### DON'T DO THIS (Wasteful)
```
Turn 1: "Let me read the ROADMAP"
- Read entire ROADMAP (400 tokens)

Turn 2: "Now let me read the plan"
- Read entire plan file (300 tokens)

Turn 3: "Let me search for existing components"
- Grep for components (200 tokens)

Turn 4: Implement with detailed explanation
- Long postamble (500 tokens)

Total: 1,400 tokens
```

### DO THIS (Efficient)
```
Turn 1: Parallel calls
- Glob patterns (100 tokens)
- Read specific sections with limit (200 tokens)
- Grep search (100 tokens)

Turn 2: Implement + commit
- Code changes (400 tokens)
- Minimal explanation (100 tokens)

Total: 900 tokens (36% savings)
```

## Red Flags (Token Waste)

🚩 Reading entire 400+ line files without limit
🚩 Sequential tool calls that should be parallel
🚩 Long explanations of obvious code
🚩 "Let me check" intermediate verification steps
🚩 Postambles longer than 2 sentences
🚩 Re-reading recently-written files
🚩 Separate commits for related changes
🚩 Testing obvious logic before commit
🚩 Explaining what the code does line-by-line
🚩 Multiple tool calls that could batch

## Green Flags (Token Efficiency)

✅ Parallel Glob + Read + Grep
✅ Batched unrelated commits
✅ Concise postambles (1-2 sentences)
✅ Skip verification unless needed
✅ Use `limit` on all file reads
✅ Combine related changes in one Edit
✅ Plan before implementing
✅ Trust TypeScript compilation
✅ Minimal explanation of code
✅ One turn per logical operation

## Token Savings by Category

| Technique | Typical Saving | Effort |
|-----------|----------------|--------|
| Parallel calls | 25-40% | LOW |
| Concise responses | 15-25% | LOW |
| Smart file reading | 20-30% | MEDIUM |
| Batch operations | 15-25% | LOW |
| Skip verification | 10-15% | LOW |
| Avoid redundancy | 10-15% | MEDIUM |
| **COMBINED** | **50-70%** | **LOW** |

## Next Steps

1. Apply to all future v0 work
2. Measure baseline vs optimized
3. Adjust based on results
4. Document new patterns discovered
5. Share with team/collaborators

## Tracking

When optimizing, track:
- Tokens spent (v0 shows at end)
- Lines of code created
- Tokens per line ratio
- Features completed
- Time per feature

**Goal:** <50 tokens per line of production code

---

**Commit Date:** July 8, 2026
**Version:** 1.0
**Status:** Ready for implementation across all v0 conversations
