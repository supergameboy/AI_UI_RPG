# Tasks

- [x] Task 1: Create TemplateRepository for database operations
  - [x] SubTask 1.1: Create TemplateRepository.ts with CRUD methods
  - [x] SubTask 1.2: Implement create, getById, getAll, update, delete methods
  - [x] SubTask 1.3: Handle JSON field serialization/deserialization

- [x] Task 2: Create TemplateService for business logic
  - [x] SubTask 2.1: Create TemplateService.ts with template management logic
  - [x] SubTask 2.2: Implement getTemplates, getTemplateById, createTemplate methods
  - [x] SubTask 2.3: Add validation for required fields

- [x] Task 3: Create Template API Routes
  - [x] SubTask 3.1: Create templateRoutes.ts with REST endpoints
  - [x] SubTask 3.2: Implement GET /api/templates (list with pagination)
  - [x] SubTask 3.3: Implement GET /api/templates/:id (single template)
  - [x] SubTask 3.4: Implement POST /api/templates (create)
  - [x] SubTask 3.5: Implement PUT /api/templates/:id (update)
  - [x] SubTask 3.6: Implement DELETE /api/templates/:id (delete)
  - [x] SubTask 3.7: Register routes in backend index.ts

- [x] Task 4: Create Frontend Template Service
  - [x] SubTask 4.1: Create templateService.ts for API calls
  - [x] SubTask 4.2: Implement getTemplates, getTemplateById methods
  - [x] SubTask 4.3: Add proper TypeScript types from shared package

- [x] Task 5: Create Frontend Template Store
  - [x] SubTask 5.1: Create templateStore.ts with Zustand
  - [x] SubTask 5.2: Implement templates state and loading state
  - [x] SubTask 5.3: Add fetchTemplates, selectTemplate actions

- [x] Task 6: Create Template Selection UI Component
  - [x] SubTask 6.1: Create TemplateSelect.tsx component
  - [x] SubTask 6.2: Display template cards with name, description, game mode
  - [x] SubTask 6.3: Implement template selection and navigation to character creation
  - [x] SubTask 6.4: Add loading and error states

- [x] Task 7: Initialize Preset Templates
  - [x] SubTask 7.1: Create preset templates data file
  - [x] SubTask 7.2: Add initialization logic in TemplateService
  - [x] SubTask 7.3: Create 4 preset templates (中世纪奇幻, 现代都市恋爱, 克苏鲁恐怖, 赛博朋克佣兵)

- [x] Task 8: Type Checking and Integration Testing
  - [x] SubTask 8.1: Run typecheck on backend
  - [x] SubTask 8.2: Run typecheck on frontend
  - [x] SubTask 8.3: Test template selection flow

# Task Dependencies

- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 2]
- [Task 8] depends on [Task 3, Task 6, Task 7]
