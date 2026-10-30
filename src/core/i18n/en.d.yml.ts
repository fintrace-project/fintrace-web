// Generated from en.yml by `npm run generate:messages`; do not edit.
declare const messages: {
  readonly app: {
    readonly name: "fintrace"
  }
  readonly common: {
    readonly loading: "Loading…"
    readonly tryAgain: "Try again"
    readonly reload: "Reload"
    readonly cancel: "Cancel"
    readonly close: "Close"
    readonly save: "Save"
    readonly saving: "Saving…"
    readonly saved: "Saved."
    readonly current: "Current"
    readonly name: "Name"
    readonly defaultCurrency: "Default currency"
    readonly arrivesWith: "Arrives with {{task}}"
  }
  readonly errors: {
    readonly signingIn: "Signing in…"
    readonly loadWorkspaces: "Could not load workspaces."
    readonly loadAccounts: "Could not load accounts."
    readonly changedElsewhere: "This changed since the page loaded."
    readonly forbidden: "You do not have access to do this."
    readonly serverAnswered: "The server answered {{status}}."
    readonly network: "Could not reach the server. Check your connection and try again."
    readonly unexpected: "Something went wrong."
    readonly reference: "Reference: <code>{{traceId}}</code>"
  }
  readonly shell: {
    readonly workspaces: "Workspaces"
    readonly workspaceSections: "Workspace sections"
    readonly workspaceSettings: "Workspace settings"
    readonly chooseWorkspace: "Choose a workspace"
    readonly myWorkspaces: "My workspaces"
    readonly createWorkspace: "Create workspace"
    readonly allWorkspaces: "All workspaces"
    readonly manageWorkspaces: "Manage workspaces"
  }
  readonly sections: {
    readonly overview: "Overview"
    readonly accounts: "Accounts"
    readonly operations: "Operations"
    readonly statistics: "Statistics"
    readonly charts: "Charts"
  }
  readonly account: {
    readonly account: "Account"
    readonly settings: "Account settings"
    readonly signedInAs: "Signed in as {{name}}"
    readonly preferences: "Preferences"
    readonly signOut: "Sign out"
  }
  readonly workspaceStatus: {
    readonly NEW: "New"
    readonly IMPORTING: "Importing"
    readonly ACTIVE: "Active"
    readonly ARCHIVED: "Archived"
    readonly DELETED: "Deleted"
  }
  readonly workspaceSummary: "{{currency}} · {{status}}"
  readonly currency: {
    readonly placeholder: "Currency"
    readonly search: "Search currencies"
    readonly searchPlaceholder: "Search by name or code"
    readonly list: "Currencies"
    readonly none: "No currency matches."
  }
  readonly totals: {
    readonly label: "Totals"
    readonly balance: "Total balance"
    readonly income: "Income this month"
    readonly expenses: "Expenses this month"
  }
  readonly archive: {
    readonly archive: "Archive"
    readonly archiving: "Archiving…"
    readonly unarchive: "Unarchive"
    readonly unarchiving: "Unarchiving…"
    readonly banner: "<b>This workspace is archived.</b> It is read-only: everything in it stays, nothing can be added or changed."
  }
  readonly newWorkspaceBanner: {
    readonly text: "<b>This workspace is new and empty.</b> You can import your history from another app now. Anything you add yourself closes import for good."
    readonly action: "Import history"
  }
  readonly home: {
    readonly signIn: "Sign in"
    readonly headline: "Know where your money went, and where it is."
    readonly lead: "fintrace keeps your accounts, operations and transfers in one ledger, and works out every balance and total for you."
    readonly signInTo: "Sign in to fintrace"
    readonly features: "Features"
    readonly accounts: {
      readonly title: "Every account in one place"
      readonly text: "Balances computed from your own history, checked against the figures your bank shows."
    }
    readonly transfers: {
      readonly title: "Transfers that add up"
      readonly text: "Move money between accounts and currencies without counting it twice as income or expense."
    }
    readonly history: {
      readonly title: "Bring your history"
      readonly text: "Import an existing record into a fresh workspace and carry on from where you were."
    }
  }
  readonly notFound: {
    readonly title: "Page not found"
    readonly back: "Back to the overview"
  }
  readonly noAccess: {
    readonly title: "No access"
    readonly text: "You are signed in, but this account has not been given access to fintrace. Ask whoever runs it to grant access, or sign out and use another account."
  }
  readonly routeError: {
    readonly title: "Something went wrong"
    readonly text: "This page could not be shown. Reloading usually helps."
    readonly home: "Go to your workspaces"
  }
  readonly overview: {
    readonly expensesByMonth: "Expenses by month"
    readonly chartPending: "The cashflow chart arrives with 4.10."
    readonly recentOperations: "Recent operations"
    readonly feedPending: "The operations feed arrives with 4.2h and 4.5."
    readonly allAccounts: "All →"
  }
  readonly accounts: {
    readonly empty: "No accounts yet."
    readonly add: "Add account"
  }
  readonly operations: {
    readonly pending: "The operations feed arrives with 4.5."
  }
  readonly statistics: {
    readonly pending: "The category breakdown arrives with 4.11."
  }
  readonly charts: {
    readonly pending: "Balance dynamics and cashflow arrive with 4.9 and 4.10."
  }
  readonly preferences: {
    readonly title: "Preferences"
    readonly empty: "Nothing to set yet."
  }
  readonly workspaces: {
    readonly title: "Your workspaces"
    readonly hello: "Hello, {{name}}"
    readonly find: "Find a workspace"
    readonly new: "New workspace"
    readonly intro: "A workspace holds one set of accounts, categories and operations. Create one to start."
    readonly createHint: "Start empty, or import your history"
    readonly archived: "Archived"
    readonly created: "Created {{date}}"
    readonly currency: "Currency"
  }
  readonly workspaceNew: {
    readonly title: "New workspace"
    readonly panel: "Workspace"
    readonly namePlaceholder: "Personal"
    readonly howToStart: "How to start"
    readonly empty: {
      readonly title: "Start empty"
      readonly text: "Add accounts and operations yourself."
    }
    readonly import: {
      readonly title: "Import history"
      readonly text: "Bring your records in from another app first. Possible only while the workspace is empty."
    }
    readonly create: "Create workspace"
    readonly creating: "Creating…"
  }
  readonly settings: {
    readonly title: "Workspace settings"
    readonly general: "General"
    readonly archive: {
      readonly title: "Archive"
      readonly active: "An archived workspace is read-only: everything in it stays, nothing can be added or changed. You can unarchive it at any time."
      readonly action: "Archive workspace"
      readonly archived: "This workspace is archived and read-only. Unarchive it from the notice at the top of the page."
      readonly new: "A new workspace has nothing to archive yet. It becomes active with its first entry or a successful import."
      readonly importing: "An import is running. The workspace can be archived once it has finished."
    }
    readonly delete: {
      readonly title: "Delete workspace"
      readonly text: "Deletion cannot be undone. The workspace and all its accounts, operations and history become unreachable at once and cannot be restored. To keep it out of sight instead, archive it."
      readonly action: "Delete workspace…"
      readonly confirmTitle: "Delete “{{name}}”?"
      readonly confirmText: "This cannot be undone. Every account, operation and balance in this workspace becomes unreachable immediately."
      readonly typeToConfirm: "Type <b>{{name}}</b> to confirm"
      readonly confirm: "Delete forever"
      readonly deleting: "Deleting…"
    }
  }
  readonly import: {
    readonly title: "Import history"
    readonly importing: "Importing…"
    readonly importingText: "Reading the file and writing it into {{workspace}}. This can take a minute; keep this page open."
    readonly intro: "Everything in the file arrives in one step: accounts, categories, operations, transfers and balances. If anything in it is refused, nothing is imported and the workspace stays empty."
    readonly from: "Import from"
    readonly drop: "<desktop>Drop the file here, or </desktop><u>choose a file</u>"
    readonly fileHint: "{{file}}, up to {{size}}"
    readonly chosen: "{{size}} · choose another"
    readonly tooBig: "This file is {{size}}; {{source}} imports accept up to {{max}}."
    readonly submit: "Import"
    readonly running: {
      readonly title: "An import is running"
      readonly text: "Another import into this workspace has not finished yet. Come back in a minute."
    }
    readonly closed: {
      readonly title: "Import is closed"
      readonly text: "History can be imported only into a new, empty workspace, and {{workspace}} is no longer new. To import history, create a workspace for it."
      readonly action: "New workspace"
    }
    readonly done: "Imported into {{workspace}}"
    readonly counts: {
      readonly accounts: "Accounts"
      readonly categories: "Categories"
      readonly operations: "Operations"
      readonly transfers: "Transfers"
      readonly anchors: "Balance anchors"
    }
    readonly open: "Open the workspace"
    readonly failed: "Nothing was imported"
    readonly refused: "The file was refused."
    readonly stillEmpty: "{{workspace}} is still empty, so you can fix the file and try again."
    readonly affected: "{{entities}} affected"
    readonly affectedField: "{{entities}} affected · field {{field}}"
    readonly more_one: "And {{count, number}} more problem."
    readonly more_other: "And {{count, number}} more problems."
    readonly retry: "Choose another file"
    readonly notes: "Notes from the importer"
    readonly error: "Error"
    readonly warning: "Warning"
    readonly diagnostic: "{{label}}: {{count, number}}"
  }
  readonly importSources: {
    readonly mok: {
      readonly file: "A .mok file exported from MOK"
    }
  }
  readonly importProblem: {
    readonly WRONG_UUID_VERSION: "Malformed identifier"
    readonly DUPLICATED_ENTITY_ID_WITHIN_SECTION: "Duplicate record"
    readonly DUPLICATED_ENTITY_ID_ACROSS_SECTIONS: "Duplicate record"
    readonly UNRESOLVED_REFERENCE: "Missing reference"
    readonly CYCLIC_REFERENCES: "Circular reference"
    readonly REFUSED_BY_COMMAND: "Refused by fintrace"
  }
  readonly importDiagnostic: {
    readonly UNSUPPORTED_RECORD: "Records skipped as unsupported"
    readonly UNKNOWN_CURRENCY: "Records skipped for an unknown currency"
    readonly UNRESOLVED_REFERENCE: "Records with a missing reference"
    readonly SOURCE_ANOMALY: "Irregularities in the source"
  }
  readonly entities: {
    readonly OPERATION_one: "{{count, number}} operation"
    readonly OPERATION_other: "{{count, number}} operations"
    readonly ACCOUNT_one: "{{count, number}} account"
    readonly ACCOUNT_other: "{{count, number}} accounts"
    readonly CATEGORY_one: "{{count, number}} category"
    readonly CATEGORY_other: "{{count, number}} categories"
    readonly TRANSFER_one: "{{count, number}} transfer"
    readonly TRANSFER_other: "{{count, number}} transfers"
    readonly BALANCE_ANCHOR_one: "{{count, number}} balance anchor"
    readonly BALANCE_ANCHOR_other: "{{count, number}} balance anchors"
  }
}
export default messages
