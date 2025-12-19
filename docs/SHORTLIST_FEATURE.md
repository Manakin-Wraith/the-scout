# Shortlist Feature - Design Document

> **Status:** Brainstorm / Design Phase  
> **Priority:** High  
> **Type:** New Feature

---

## Overview

A multi-list selection system allowing users to curate, organize, and export groups of influencers/creators for various purposes (activation, removal, review, campaign planning, etc.).

---

## User Stories

1. **As a user**, I want to select multiple users from any tab and add them to a named list.
2. **As a user**, I want to create multiple lists for different purposes (e.g., "To Remove", "Campaign Q1", "High Priority Activations").
3. **As a user**, I want to drill down into a list to see detailed information about each user.
4. **As a user**, I want to export a list as CSV/JSON for external use or database updates.
5. **As a user**, I want to remove users from a list or delete entire lists.
6. **As a user**, I want to see which lists a user is already in when viewing them.

---

## Data Model

### Types (add to `types.ts`)

```typescript
// Shortlist item - can be any user type
export type ShortlistItemType = 'deal_taker' | 'dormant' | 'non_interactor' | 'enriched_deal_taker' | 'enriched_dormant';

export interface ShortlistItem {
  id: string;                    // Unique identifier (X_Handle, telegramId, or User_ID)
  type: ShortlistItemType;       // Source type for proper rendering
  addedAt: string;               // ISO timestamp
  notes?: string;                // Optional user notes
  
  // Denormalized data for display (avoids lookups)
  displayName: string;           // @handle or name
  xHandle?: string;
  telegramHandle?: string;
  earnings?: number;
  followers?: number;
  riskLevel?: RiskLevel;
  qualityScore?: number;
}

export interface Shortlist {
  id: string;                    // UUID
  name: string;                  // User-defined name
  description?: string;          // Optional description
  color: string;                 // Badge color for visual distinction
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  items: ShortlistItem[];
}

export interface ShortlistState {
  lists: Shortlist[];
  activeListId: string | null;   // Currently selected list for quick-add
}
```

---

## Architecture

### State Management

**Option A: React Context (Recommended for this app)**
- Create `ShortlistContext` with provider at App level
- Persist to `localStorage` for session continuity
- Simple, no additional dependencies

**Option B: Zustand**
- Lightweight state management
- Built-in persistence middleware
- Better for complex state

### Recommended: Context + localStorage

```
App.tsx
└── ShortlistProvider (context)
    ├── Sidebar (shows list count badge)
    ├── ShortlistTab (dedicated management view)
    └── All other tabs (can add to lists)
```

---

## UI Components

### 1. ShortlistProvider (`contexts/ShortlistContext.tsx`)

```typescript
interface ShortlistContextValue {
  lists: Shortlist[];
  activeListId: string | null;
  
  // List CRUD
  createList: (name: string, color?: string, description?: string) => Shortlist;
  updateList: (id: string, updates: Partial<Shortlist>) => void;
  deleteList: (id: string) => void;
  
  // Item operations
  addToList: (listId: string, item: ShortlistItem) => void;
  removeFromList: (listId: string, itemId: string) => void;
  moveToList: (fromListId: string, toListId: string, itemId: string) => void;
  
  // Quick-add (uses activeListId)
  setActiveList: (id: string | null) => void;
  quickAdd: (item: ShortlistItem) => void;
  
  // Queries
  isInList: (listId: string, itemId: string) => boolean;
  getListsContaining: (itemId: string) => Shortlist[];
  
  // Export
  exportList: (listId: string, format: 'csv' | 'json') => void;
}
```

### 2. ShortlistTab (`components/ShortlistTab.tsx`)

Main management interface with:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Shortlists                                                   │
├─────────────────────────────────────────────────────────────────┤
│ [+ New List]  [Export All ▼]                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ 🔴 To Remove     │  │ 🟢 Q1 Activations│  │ 🟡 Review    │  │
│  │ 12 items         │  │ 8 items          │  │ 5 items      │  │
│  │ [View] [Export]  │  │ [View] [Export]  │  │ [View] [...]│  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Selected List: "To Remove" (12 items)                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ☑ @user1  │ Deal Taker │ $5,200 │ Critical │ [Remove] [👁]│ │
│ │ ☑ @user2  │ Dormant    │ 1.2k SF│ Warning  │ [Remove] [👁]│ │
│ │ ...                                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Select All] [Remove Selected] [Move to... ▼] [Export CSV]      │
└─────────────────────────────────────────────────────────────────┘
```

### 3. AddToListButton (`components/AddToListButton.tsx`)

Reusable button/dropdown for adding items from any tab:

```
┌─────────────────────────┐
│ [+ Add to List ▼]       │
├─────────────────────────┤
│ ★ Quick Add (To Remove) │  ← Active list
│ ─────────────────────── │
│ 🔴 To Remove            │
│ 🟢 Q1 Activations       │
│ 🟡 Review               │
│ ─────────────────────── │
│ + Create New List...    │
└─────────────────────────┘
```

### 4. ListBadge (`components/ListBadge.tsx`)

Small indicator showing which lists a user belongs to:

```
@username [🔴] [🟢]  ← User is in 2 lists
```

### 5. BulkSelectBar (`components/BulkSelectBar.tsx`)

Floating action bar when items are selected:

```
┌─────────────────────────────────────────────────────────────────┐
│ ✓ 5 selected  │ [Add to List ▼] [Clear Selection]              │
└─────────────────────────────────────────────────────────────────┘
```

### 6. CreateListModal (`components/CreateListModal.tsx`)

Modal for creating new lists:

```
┌─────────────────────────────────────────────────────────────────┐
│ Create New List                                            [X] │
├─────────────────────────────────────────────────────────────────┤
│ Name: [________________________]                                │
│ Description: [________________________] (optional)              │
│ Color: [🔴] [🟢] [🟡] [🔵] [🟣] [⚪]                            │
│                                                                 │
│                              [Cancel] [Create List]             │
└─────────────────────────────────────────────────────────────────┘
```

### 7. ListDetailPanel (`components/ListDetailPanel.tsx`)

Drill-down view for a single list (slide-over panel like CreatorDetailPanel):

- List metadata (name, description, created date)
- Item count and breakdown by type
- Full item table with sorting/filtering
- Bulk actions
- Export options

---

## Integration Points

### Tabs to Modify

| Tab | Changes Needed |
|-----|----------------|
| `RosterTab` | Add checkbox column, AddToListButton per row, BulkSelectBar |
| `GoldmineTab` | Add checkbox, AddToListButton on cards |
| `OnboardingTab` | Add checkbox column, AddToListButton |
| `RiskRadarTab` | Add checkbox column, AddToListButton (high priority for flagged users) |
| `WhaleHunterTab` | Add checkbox, AddToListButton on cards |
| `Sidebar` | Add "Shortlists" nav item with count badge |
| `App.tsx` | Wrap with ShortlistProvider, add ShortlistTab route |

### Helper Functions (`services/shortlistService.ts`)

```typescript
// Convert various user types to ShortlistItem
export const dealTakerToShortlistItem = (dt: DealTaker | EnrichedDealTaker): ShortlistItem => {...}
export const dormantToShortlistItem = (d: DormantInfluencer | EnrichedDormant): ShortlistItem => {...}
export const nonInteractorToShortlistItem = (ni: NonInteractor): ShortlistItem => {...}

// Export functions
export const exportToCSV = (list: Shortlist): string => {...}
export const exportToJSON = (list: Shortlist): string => {...}
export const downloadFile = (content: string, filename: string, type: string) => {...}

// localStorage persistence
export const saveToStorage = (state: ShortlistState) => {...}
export const loadFromStorage = (): ShortlistState | null => {...}
```

---

## Export Formats

### CSV Export

```csv
id,type,displayName,xHandle,telegramHandle,earnings,followers,riskLevel,qualityScore,addedAt,notes
abc123,deal_taker,@cryptoking,cryptoking,,5200,,critical,,2024-01-15T10:30:00Z,"High risk - VPN detected"
def456,dormant,@whalewatch,,whalewatch,,15000,,72.5,2024-01-15T11:00:00Z,
```

### JSON Export

```json
{
  "listName": "To Remove",
  "exportedAt": "2024-01-15T12:00:00Z",
  "itemCount": 12,
  "items": [
    {
      "id": "abc123",
      "type": "deal_taker",
      "displayName": "@cryptoking",
      "xHandle": "cryptoking",
      "earnings": 5200,
      "riskLevel": "critical",
      "addedAt": "2024-01-15T10:30:00Z",
      "notes": "High risk - VPN detected"
    }
  ]
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure
1. Define types in `types.ts`
2. Create `ShortlistContext` with localStorage persistence
3. Create `shortlistService.ts` with conversion and export functions
4. Add `shortlists` to `TabView` type

### Phase 2: Management UI
1. Build `ShortlistTab` component
2. Build `CreateListModal` component
3. Build `ListDetailPanel` component
4. Update `Sidebar` and `App.tsx`

### Phase 3: Integration
1. Create `AddToListButton` component
2. Create `BulkSelectBar` component
3. Add selection state to `RosterTab`
4. Add selection state to `GoldmineTab`

### Phase 4: Full Rollout
1. Integrate with remaining tabs
2. Add `ListBadge` indicators
3. Add keyboard shortcuts (Shift+click for range select)
4. Add drag-and-drop reordering

### Phase 5: Polish
1. Add undo/redo for list operations
2. Add list templates (pre-configured lists)
3. Add list sharing (export/import list definitions)
4. Add list analytics (when items were added, etc.)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + A` | Select all visible items |
| `Escape` | Clear selection |
| `Shift + Click` | Range select |
| `Ctrl/Cmd + Click` | Toggle individual selection |
| `L` | Open shortlist panel |
| `N` | Create new list (when in shortlist tab) |

---

## Color Palette

```typescript
const LIST_COLORS = [
  { name: 'red', value: '#ef4444', bg: 'bg-red-500/20', border: 'border-red-500/50' },
  { name: 'orange', value: '#f97316', bg: 'bg-orange-500/20', border: 'border-orange-500/50' },
  { name: 'amber', value: '#f59e0b', bg: 'bg-amber-500/20', border: 'border-amber-500/50' },
  { name: 'emerald', value: '#10b981', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50' },
  { name: 'blue', value: '#3b82f6', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
  { name: 'purple', value: '#8b5cf6', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
  { name: 'pink', value: '#ec4899', bg: 'bg-pink-500/20', border: 'border-pink-500/50' },
  { name: 'slate', value: '#64748b', bg: 'bg-slate-500/20', border: 'border-slate-500/50' },
];
```

---

## Edge Cases & Considerations

1. **Duplicate Prevention**: Same user can't be added to same list twice
2. **Orphaned Items**: If source data changes, shortlist items remain (denormalized)
3. **Large Lists**: Virtualize list rendering for 100+ items
4. **Storage Limits**: localStorage ~5MB limit; warn user if approaching
5. **Cross-Tab Sync**: Use `storage` event listener for multi-tab support
6. **Empty States**: Clear messaging when no lists or empty list

---

## Success Metrics

- Users can create and manage multiple lists
- Users can add items from any tab with 2 clicks or less
- Export works reliably for CSV and JSON
- Lists persist across browser sessions
- Drill-down shows full item details

---

## References

- Existing drill-down pattern: `@/components/CreatorDetailPanel.tsx`
- Modal pattern: Can adapt from existing components
- State management: Currently using React `useState` at component level
- Export utilities: None existing (new implementation needed)
