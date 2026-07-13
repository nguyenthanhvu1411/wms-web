# Enterprise Returns Module Upgrade Plan

This plan details the orchestration process to upgrade the Returns Module (both Customer and Vendor Returns) to Enterprise WMS standards.

## 🎼 Orchestration Report
### Task
Upgrade the Returns Module to include comprehensive enterprise data (Customer/Vendor details, Staff, Logistics, Finance, Document Links, Attachments, Audit Logs, and advanced Status flows).

### Mode
`plan`

### Agents Invoked (MINIMUM 3)
| # | Agent | Focus Area | Status |
|---|-------|------------|--------|
| 1 | `project-planner` | Task breakdown, PLAN.md creation | ✅ |
| 2 | `database-architect` | Pending | ⏳ |
| 3 | `backend-specialist` | Pending | ⏳ |
| 4 | `frontend-specialist`| Pending | ⏳ |

---

## 1. Goal Description
The objective is to enrich the current `ReturnOrder` (Customer Return) and `ReturnToVendor` (Vendor Return) modules. This will involve expanding database schemas (or DTO mappings if tables already exist), adding ~50 new fields across headers and lines, updating the state machine for returns, implementing file attachments, and creating audit logs.

## 2. User Review Required
- **State Machine Complexity:** We are introducing a significantly more complex status flow for Customer Returns. Will this break existing logic in `OperationsService`?
- **Attachments & Audits:** Should we create generic `Attachment` and `AuditLog` tables, or specific ones like `ReturnOrderAttachment`?
- **Database Schema:** We will need to update EF Core entities (`ReturnOrder`, `ReturnOrderLine`, `ReturnToVendor`, `ReturnToVendorLine`) and generate a migration.

## 3. Proposed Changes

### Phase 1: Database & Shared Enums (`database-architect`)
- Add new statuses to `ReturnOrderStatus`: `Submitted`, `Receiving`, `QC`, `Disposition`, `Putaway`, `Closed`, `Rejected`, `WaitingRefund`, `Refunded`.
- Add new properties to EF Core entities.

### Phase 2: Backend API & DTOs (`backend-specialist`)
- Update `ReturnOrderResponse`, `ReturnOrderLineResponse` in `OperationsDtos.cs`.
- Update `ReturnToVendorResponse` in `InboundEnterpriseDtos.cs`.

### Phase 3: Frontend Types & UI (`frontend-specialist`)
- Sync interfaces `ReturnOrder`, `ReturnOrderLine`, `ReturnToVendor` in `operations.ts`.
- Update UI lists, add "Create Return" button, remove "DTO GAP" mockups.

## 4. Verification Plan
- Run backend unit tests using `test_runner.py`.
- Run `lint_runner.py` and `security_scan.py`.
- Manually test Customer Return and Vendor Return flows on the UI.
