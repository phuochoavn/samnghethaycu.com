# Medusa V2 Admin Build Path Discovery

**Issue**: Admin panel builds (41.5s) but files not found at expected location
**Status**: 🔍 INVESTIGATING

---

## 🎯 The Mystery

### What We Know:

1. ✅ `medusa build` is running (build time: 41.5s, not 4.9s)
2. ✅ `package.json` has correct script: `"build": "medusa build"`
3. ✅ `@medusajs/admin-sdk` is installed
4. ✅ `medusa-config.ts` has `admin.disable: false`
5. ❌ Files not found at `.medusa/admin`

**Conclusion**: Admin IS building, but output location is DIFFERENT than expected.

---

## 🔍 Investigation Strategy

### Possible Admin Build Locations in Medusa v2:

1. `.medusa/admin/` - Expected location (standard)
2. `.medusa/server/admin/` - Alternative v2 structure
3. `dist/admin/` - Compiled with backend code
4. `build/admin/` - Custom build directory
5. Root level `admin/` - Non-standard

### Why Location Matters:

The Dockerfile currently has:
```dockerfile
COPY --from=builder /app/.medusa ./.medusa
```

If admin files are actually in `.medusa/server/admin`, this COPY is incomplete!

---

## 🛠️ Diagnostic Dockerfile

We've added comprehensive debugging to find the actual location:

```dockerfile
# DEBUG: Show complete directory structure
RUN echo "=== DIRECTORY STRUCTURE AFTER BUILD ===" && \
    ls -la && \
    echo "=== CHECKING .medusa DIRECTORY ===" && \
    ls -la .medusa 2>/dev/null || echo ".medusa not found" && \
    echo "=== CHECKING dist DIRECTORY ===" && \
    ls -la dist 2>/dev/null || echo "dist not found" && \
    echo "=== SEARCHING FOR index.html (admin entry point) ===" && \
    find . -name "index.html" -type f 2>/dev/null && \
    echo "=== SEARCHING FOR admin DIRECTORIES ===" && \
    find . -type d -name "admin" 2>/dev/null
```

---

## 📊 How to Run Diagnostic Build

### Step 1: Build with Debug Output

```bash
cd ~/samnghethaycu.com
docker-compose build --no-cache backend 2>&1 | tee build-debug.log
```

This will:
- Build the backend image
- Show all debug output
- Save output to `build-debug.log`

---

### Step 2: Analyze Build Output

Look for these sections in the output:

#### A. Directory Structure After Build

```
=== DIRECTORY STRUCTURE AFTER BUILD ===
drwxr-xr-x    5 root     root          4096 Jan 19 12:00 .
drwxr-xr-x    3 root     root          4096 Jan 19 12:00 ..
drwxr-xr-x    3 root     root          4096 Jan 19 12:00 .medusa
drwxr-xr-x    5 root     root          4096 Jan 19 12:00 dist
drwxr-xr-x  500 root     root         20480 Jan 19 12:00 node_modules
```

**What to look for**: Confirm `.medusa` exists

---

#### B. .medusa Directory Contents

```
=== CHECKING .medusa DIRECTORY ===
drwxr-xr-x    3 root     root          4096 Jan 19 12:00 .
drwxr-xr-x    5 root     root          4096 Jan 19 12:00 ..
drwxr-xr-x    2 root     root          4096 Jan 19 12:00 server
```

**What to look for**:
- If you see `admin/` → Admin at `.medusa/admin` ✅
- If you see `server/` → Check if admin is inside server
- If empty → Admin not building (config issue)

---

#### C. index.html Search Results

```
=== SEARCHING FOR index.html ===
./.medusa/server/admin/index.html
./dist/admin/index.html
```

**CRITICAL**: This shows the ACTUAL location!

**Example interpretations:**
- `./.medusa/server/admin/index.html` → Admin at `.medusa/server/admin/`
- `./.medusa/admin/index.html` → Admin at `.medusa/admin/` (expected)
- `./dist/admin/index.html` → Admin compiled into dist
- No results → Admin not building (major issue)

---

#### D. Admin Directories Found

```
=== SEARCHING FOR admin DIRECTORIES ===
./.medusa/server/admin
./node_modules/@medusajs/admin
```

**What to look for**:
- Ignore `./node_modules/@medusajs/admin` (source code)
- Focus on actual build output directories

---

## 🔧 Fixing Based on Discovery

### Scenario 1: Admin at `.medusa/server/admin`

**Dockerfile fix:**
```dockerfile
# Copy from correct location
COPY --from=builder /app/.medusa/server/admin ./.medusa/server/admin

# OR copy entire .medusa (includes server folder)
COPY --from=builder /app/.medusa ./.medusa

# Verify
RUN ls -la .medusa/server/admin && echo "✓ Admin found at .medusa/server/admin"
```

---

### Scenario 2: Admin at `dist/admin`

**Dockerfile fix:**
```dockerfile
# Admin is part of dist build
COPY --from=builder /app/dist ./dist

# Verify
RUN ls -la dist/admin && echo "✓ Admin found in dist/admin"
```

**Note**: This means Medusa compiled admin INTO the backend dist

---

### Scenario 3: Admin at `.medusa/admin` (Expected)

**If found here but still failing:**
```dockerfile
# Check if it's a nested structure
COPY --from=builder /app/.medusa ./.medusa

# Verify with full path
RUN ls -la .medusa && \
    ls -la .medusa/admin && \
    ls -la .medusa/admin/index.html && \
    echo "✓ Admin found at correct location"
```

---

### Scenario 4: No Admin Build Output

**If index.html NOT found anywhere:**

Possible causes:
1. `admin.disable` is somehow still `true` or `undefined`
2. `@medusajs/admin-sdk` version mismatch
3. Build error being silently swallowed
4. Need to check actual build logs

**Debug medusa-config.ts:**
```typescript
admin: {
  disable: false,  // Verify this is explicitly false
  path: "/admin",  // Try adding explicit path
  backendUrl: process.env.MEDUSA_BACKEND_URL || "https://api.samnghethaycu.com",
}
```

---

## 📝 Next Steps After Discovery

### Step 1: Identify Actual Location

From build logs, find the output of:
```
=== SEARCHING FOR index.html ===
```

Note the exact path.

---

### Step 2: Update Dockerfile COPY Commands

Replace:
```dockerfile
COPY --from=builder /app/.medusa ./.medusa
```

With the correct path based on discovery.

---

### Step 3: Update Verification

Replace:
```dockerfile
RUN ls -la .medusa/admin
```

With the actual path:
```dockerfile
RUN ls -la .medusa/server/admin  # or whatever path found
```

---

### Step 4: Rebuild and Verify

```bash
docker-compose build --no-cache backend
docker-compose up -d
docker exec samnghethaycu_backend ls -la <actual-admin-path>
```

---

## 🔍 Alternative: Runtime Discovery

If build continues to fail, check in a RUNNING container:

```bash
# Start container (even if admin "missing")
docker-compose up -d

# Exec into container
docker exec -it samnghethaycu_backend sh

# Search for admin files
find / -name "index.html" -type f 2>/dev/null | grep -v node_modules

# Check Medusa runtime paths
ls -la .medusa
ls -la dist
cat medusa-config.ts | grep -A 10 "admin:"
```

---

## 📚 Medusa V2 Admin Build Reference

### Standard Locations by Version:

**Medusa v2.0.0 - v2.0.5:**
- Build output: `.medusa/server/admin/`
- Served from: `/app/.medusa/server/admin/`

**Medusa v2.0.6+:**
- Build output: `.medusa/admin/`
- Served from: `/app/.medusa/admin/`

**Custom Configuration:**
```typescript
admin: {
  path: "/custom-admin",  // Changes serve path
  outDir: "./custom-build/admin",  // Changes build output
}
```

---

## 🎯 Expected Outcome

After running diagnostic build, you should see output like:

```
=== SEARCHING FOR index.html ===
./.medusa/server/admin/index.html

=== SEARCHING FOR admin DIRECTORIES ===
./.medusa/server/admin
```

This tells us: **Admin is at `.medusa/server/admin/`**

Then we update Dockerfile accordingly.

---

## ✅ Success Criteria

After fix, you should see:

```
Step X: COPY --from=builder /app/.medusa/server/admin ./.medusa/server/admin
 → Copying admin files... ✓

Step Y: RUN ls -la .medusa/server/admin
 → drwxr-xr-x assets/
 → -rw-r--r-- index.html ✓
 → ✓ Admin panel build found ✓
```

---

## 🚨 If Admin Still Not Found

**Last resort debug:**

```dockerfile
# In builder stage, after npm run build
RUN npm run build && \
    echo "=== FULL FILE TREE ===" && \
    find . -type f -name "*.html" && \
    find . -type f -name "*.js" | grep -v node_modules | head -20
```

This shows ALL HTML and JS files (excluding node_modules) to find where admin went.

---

**Last Updated**: 2026-01-19
**Status**: 🔍 Diagnostic build ready - Run and share output
**Next**: Analyze build logs to find actual admin location
