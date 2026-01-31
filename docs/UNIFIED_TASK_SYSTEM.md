# Unified Task System: Complete Guide

## 🎯 Overview

The **Unified Task System** consolidates all task submission into a single, intelligent template that handles everything from simple fixes to complex research and analysis.

**Key Features:**
- ✅ Single template for all tasks (no confusion)
- ✅ Handles vague requests ("make it better")
- ✅ Supports complex tasks (research, review, analyze, improve)
- ✅ Intelligent task type detection
- ✅ Automatic routing to specialized handlers
- ✅ Multi-phase execution for complex tasks

---

## 📝 What Happened to Multiple Templates?

### Previous State (Confusing)
- ❌ `task.yml` - Standard detailed template
- ❌ `smart-task.yml` - Minimal input template
- ❌ Unclear which to use when
- ❌ Feature overlap

### Current State (Unified)
- ✅ `ai-task-unified.yml` - **ONE template for everything**
- ✅ Adapts to task complexity automatically
- ✅ Clear, no confusion
- ✅ All features available always

**Action Taken:** The old templates remain for backwards compatibility but are now deprecated. Use the unified template for all new tasks.

---

## 🧠 Task Types Supported

### 1. Implementation Tasks
**What:** Build, fix, update code

**Examples:**
- "Fix the login bug"
- "Add rate limiting to API"
- "Update documentation"
- "Refactor user module"

**Output:** PR with code changes

### 2. Research Tasks
**What:** Investigate, learn, compare options

**Examples:**
- "Research best caching strategies"
- "Investigate alternatives to Redis"
- "Learn about accessibility standards"
- "Compare testing frameworks"

**Output:** Research report + optional implementation

### 3. Review/Analysis Tasks
**What:** Examine systems, identify issues

**Examples:**
- "Review the platform to identify deployment failure points"
- "Analyze the auth system for security issues"
- "Audit API performance"
- "Examine error handling practices"

**Output:** Analysis report + recommended fixes

### 4. Improvement Tasks
**What:** Enhance existing features

**Examples:**
- "Improve the UI for better accessibility"
- "Enhance error messages"
- "Optimize database queries"
- "Better mobile experience"

**Output:** Analysis + code improvements

### 5. Mixed/Complex Tasks
**What:** Multi-phase tasks requiring research + analysis + implementation

**Examples:**
- "Research and implement OAuth2"
- "Review deployment pipeline and fix issues"
- "Analyze UI and improve accessibility"
- "Learn about WebSockets and add real-time features"

**Output:** Research report + analysis + PR with changes

---

## 🎯 How It Works

### Intelligent Task Classification

When you submit a task, the system:

1. **Analyzes your goal** using NLP
2. **Detects task type** (implementation, research, review, improve)
3. **Classifies complexity** (simple, moderate, complex)
4. **Routes to handlers** (standard agent, research agent, analyst, UI/UX specialist)
5. **Determines outputs** (code only, report only, or both)
6. **Executes appropriately** (single-phase or multi-phase)

### Example: Complex Task

**You submit:**
```
Review the platform to identify deployment failure points
```

**System detects:**
```json
{
  "task_type": "analysis",
  "handler": "platform-analyst",
  "output": "both (report + fixes)",
  "complexity": "moderate",
  "subagents": ["platform-analyst", "cloudflare-auditor"]
}
```

**Execution:**
1. Platform analyst reviews deployment pipeline
2. Identifies 5 failure points
3. Creates analysis report in `docs/analysis/`
4. Implements fixes for critical issues
5. Creates PR with fixes + report
6. Issue comment links to both

---

## 📊 Task Complexity Levels

### Simple Tasks (1-2 steps)
- Clear, focused goal
- Single area of change
- Standard implementation

**Example:** "Fix typo in README"

### Moderate Tasks (3-4 steps)
- Multiple components
- Requires some research/analysis
- Standard complexity

**Example:** "Add caching to API with Redis"

### Complex Tasks (5+ steps)
- Multi-phase execution
- Significant research needed
- Multiple areas affected
- Requires coordination

**Example:** "Research, analyze, and improve the UI for accessibility"

---

## 🔄 Execution Strategies

### Single-Phase Execution
**For:** Simple implementation tasks

**Flow:**
```
Parse task → Implement → Test → Create PR → Done
```

### Multi-Phase Execution
**For:** Research, review, or complex tasks

**Flow:**
```
Phase 1: Research/Analysis
  → Gather information
  → Create report
  → Get approval/feedback
  
Phase 2: Implementation (if needed)
  → Apply findings
  → Implement changes
  → Create PR
  
Phase 3: Validation
  → Test changes
  → Verify fixes
  → Close task
```

---

## 🎨 Specialized Handlers

### Research Agent
**When:** Keywords like "research", "investigate", "explore", "learn"

**Capabilities:**
- Investigates best practices
- Compares multiple approaches
- Documents findings
- Recommends solutions

**Output Location:** `docs/research/[topic]-YYYY-MM-DD.md`

### Platform Analyst
**When:** Keywords like "review", "analyze", "audit", "identify"

**Capabilities:**
- Examines systems/components
- Identifies failure points
- Assesses security/performance
- Provides remediation steps

**Output Location:** `docs/analysis/[component]-analysis-YYYY-MM-DD.md`

### UI/UX Agent
**When:** Keywords like "ui", "ux", "accessibility", "mobile", "improve design"

**Capabilities:**
- Analyzes user interfaces
- Checks accessibility (WCAG)
- Reviews responsiveness
- Suggests improvements
- Implements changes

**Output:** Analysis + code changes

### Standard Agent
**When:** Keywords like "fix", "add", "implement", "update"

**Capabilities:**
- Implements features
- Fixes bugs
- Updates code
- Refactors when needed

**Output:** PR with code changes

---

## 💡 How to Use

### Quick Start

1. **Go to Issues** → **New Issue**
2. **Select "AI Task (Unified)"**
3. **Describe your task naturally**
4. **Submit**

### Examples

#### Simple Implementation
```
Goal: Fix the login button color
```

#### Research Task
```
Goal: Research best practices for API versioning

Context:
We need to decide on a versioning strategy.
Should we use URL versioning or header-based?

Output: Report with recommendation
```

#### Review Task
```
Goal: Review the deployment pipeline and identify failure points

Context:
We've had 3 failed deployments this week.
Need to understand what's causing them.

Output: Analysis report + fixes for critical issues
```

#### Complex Improvement
```
Goal: Research and improve the UI for better accessibility

Context:
Our app needs to meet WCAG AA standards.
Focus on keyboard navigation and screen readers.

Output: Both research findings and implementation
```

#### Vague Request (System Handles!)
```
Goal: Make the app faster

(System will analyze, identify bottlenecks, research solutions, implement)
```

---

## 🎛️ Template Fields Explained

### Goal (Required)
Describe what you need - be as specific or vague as you want.

**Simple:**
```
Fix typo in README
```

**Complex:**
```
Research modern authentication methods, analyze our current implementation,
and recommend improvements with a migration plan
```

### Task Type (Optional)
System auto-detects, but you can override:
- `auto` - Let AI figure it out (recommended)
- `implementation` - Build/fix code
- `research` - Investigate and document
- `review` - Analyze existing systems
- `improve` - Enhance features
- `mixed` - Multiple phases

### Context (Optional)
Extra information to guide the AI:
- Specific areas to focus
- Constraints or requirements
- Related issues/PRs
- Success criteria

### Output Type (Optional)
What deliverable you need:
- `auto` - AI decides based on task
- `code` - PR with changes
- `report` - Analysis/research document
- `recommendations` - Findings + action items
- `both` - Code + documentation

### Priority (Optional)
- `auto` - AI decides
- `low` - Explore thoroughly, no rush
- `medium` - Normal timeline
- `high` - Focus on quick wins, urgent

---

## 📂 Output Locations

### Code Changes
- **Location:** Working branch → PR
- **Files:** Code, tests, configuration

### Research Reports
- **Location:** `docs/research/[topic]-[date].md`
- **Content:** Findings, options, recommendations

### Analysis Reports
- **Location:** `docs/analysis/[component]-[date].md`
- **Content:** Issues found, severity, fixes

### Improvement Plans
- **Location:** `docs/improvements/[feature]-[date].md`
- **Content:** Current state, proposed changes, roadmap

---

## 🔍 Behind the Scenes

### Task Processing Flow

```
1. Issue Created
   ↓
2. Task Runner Workflow Triggered
   ↓
3. Task Type Classification
   - NLP analysis
   - Complexity scoring
   - Handler selection
   ↓
4. Context Discovery (if simple task)
   - File search
   - Git history
   - Risk assessment
   ↓
5. Routing to Handler
   - Standard → Direct implementation
   - Research → Research agent
   - Analysis → Platform analyst
   - Improve → Multi-phase with subagents
   ↓
6. Execution
   - Single-phase: Implement → PR
   - Multi-phase: Research → Analysis → Implement
   ↓
7. Deliverables
   - Code: PR created
   - Docs: Report in docs/
   - Both: PR + linked report
   ↓
8. Verification & Merge
   - CI/CD runs
   - Auto-merge (if low-risk)
   - Manual review (if needed)
   ↓
9. Issue Closed Automatically
```

---

## 🚨 Migration from Old Templates

### If You Used: task.yml
**Switch to:** ai-task-unified.yml

**Changes:**
- Keep same level of detail if you want
- Or simplify - AI now handles auto-detection
- All fields still available

### If You Used: smart-task.yml
**Switch to:** ai-task-unified.yml

**Changes:**
- Same minimal input style works
- Now supports complex tasks too
- Additional options available if needed

### Backwards Compatibility

Old templates still work but show deprecation notice:
- `task.yml` → Redirects to unified template
- `smart-task.yml` → Redirects to unified template

---

## 🎓 Best Practices

### For Simple Tasks
```
Keep it short and clear:
"Fix the login bug"
"Add rate limiting"
"Update API docs"
```

### For Research Tasks
```
Be clear about what you need:
"Research X and recommend Y"
"Investigate options for Z"
"Compare A vs B for our use case"
```

### For Review Tasks
```
Specify scope:
"Review deployment pipeline"
"Audit security practices"
"Analyze performance bottlenecks"
```

### For Complex Tasks
```
Break it down or let AI figure it out:
"Research, analyze, and improve X"
"Review Y and implement fixes"
"Learn about Z and add support"
```

### For Vague Requests
```
Just be honest:
"Make the app faster"
"Improve the UI"
"Fix the deployment issues"

(System will analyze and determine specifics)
```

---

## ❓ FAQ

**Q: Which template should I use?**
A: Use `ai-task-unified.yml` for everything. It's the only one you need.

**Q: What happened to smart-task.yml?**
A: Deprecated. All its features are now in the unified template.

**Q: Can I still be detailed if I want?**
A: Yes! Add as much context as you want in the context field.

**Q: How does it handle vague requests?**
A: AI analyzes, classifies, discovers context, and determines the best approach.

**Q: What if AI gets it wrong?**
A: You can override task_type and output_type fields manually.

**Q: How long do complex tasks take?**
A: Depends on phases. Research phase might take hours, but you get incremental updates.

**Q: Can I see progress on multi-phase tasks?**
A: Yes, the agent posts updates to the issue as each phase completes.

**Q: What if I need both research and code?**
A: Set output_type to "both" or let AI auto-detect (it will if task requires it).

---

## 🎯 Summary

**Old System (Confusing):**
- Multiple templates
- Unclear which to use
- Feature overlap
- Limited to simple tasks

**New System (Unified):**
- ✅ Single template for everything
- ✅ Handles simple to complex
- ✅ Auto-detects task type
- ✅ Intelligent routing
- ✅ Multi-phase execution
- ✅ Specialized handlers
- ✅ Research & analysis support
- ✅ No confusion!

**Result:** Submit ANY task naturally and the system figures out how to handle it!

---

## 🚀 Get Started

**Your first unified task:**

1. Issues → New Issue
2. Select "AI Task (Unified)"
3. Try:
   ```
   Review the deployment pipeline to identify potential failure points
   ```
4. Submit
5. Watch it analyze, report, and fix! ✨

**Simple, powerful, unified.** 🎉
