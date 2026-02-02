# Custom Modules

This directory contains custom Medusa v2 modules following the Module Architecture.

## Planned Modules

- **Blog Module**: Content management with TipTap editor (Phase 2)
- **Traceability Module**: Product origin tracking system (Phase 3)

## Structure

Each module should follow this structure:
```
/module-name
  ├── /models        # Data models
  ├── /services      # Business logic
  ├── /workflows     # Workflow definitions
  └── index.ts       # Module definition
```

## Resources

- [Medusa v2 Module Development](https://docs.medusajs.com/v2/modules)
- [Custom Modules Guide](https://docs.medusajs.com/v2/advanced-development/modules/create)
