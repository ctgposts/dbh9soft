# Rule-Based User Management System

## Overview

The Rule-Based User Management System is an advanced feature that allows administrators to create custom roles, define conditional rules, and manage user permissions dynamically. This system provides flexible control over user access and behavior without requiring code changes.

## Features

### 1. **User Roles**
Create predefined roles with specific permission sets.

**Available Permissions:**
- `view_dashboard` - Access to dashboard
- `pos_access` - Point of Sale system access
- `inventory_manage` - Inventory management
- `customer_manage` - Customer management
- `sales_view` - View sales reports
- `reports_view` - View all reports
- `settings_manage` - Manage system settings
- `users_manage` - User management
- `branch_manage` - Branch management
- `admin_access` - Full administrative access

### 2. **User Rules**
Define conditional rules that automatically apply permissions or roles based on user attributes.

**How Rules Work:**
- **Condition**: A JavaScript expression that evaluates against user data
- **Action**: The operation to perform if the condition is true
- **Priority**: Determines the order of rule execution (higher numbers execute first)
- **Active Status**: Toggle rules on/off without deleting them

**Example Conditions:**
```javascript
// Manager role
position === 'Manager'

// Sales team
position === 'Sales Associate' || position === 'Manager'

// Active employees from branch
isActive === true && branchId === 'branch-123'

// Complex conditions
(position === 'Manager' || permissions.includes('admin')) && isActive === true
```

### 3. **Permission Templates**
Pre-built permission sets organized by category for quick role creation.

**Categories:**
- **Sales**: POS and sales-related permissions
- **Inventory**: Stock and inventory management
- **Reports**: Analytics and reporting access
- **Admin**: Administrative features
- **Settings**: System configuration

### 4. **Rule Application Logs**
Track when and how rules are applied to users.

**Log Information:**
- Rule name and ID
- User affected
- Application type (auto, manual, scheduled)
- Success or failure status
- Timestamp and error details

## Accessing the Feature

### Settings → User Rules Tab

1. Navigate to **Settings** page
2. Click the **User Rules** tab (🔐 icon)
3. Access four sub-sections:
   - **Rules**: Create and manage conditional rules
   - **Roles**: Define user roles with permissions
   - **Templates**: View built-in permission templates
   - **Logs**: Monitor rule applications

## Creating User Roles

### Step-by-Step Guide

1. Open **Settings** → **User Rules** → **Roles**
2. Click **+ Add New Role**
3. Fill in the role details:
   - **Role Name**: Unique identifier (e.g., "Store Manager")
   - **Description**: Optional description of the role's purpose
   - **Permissions**: Select permissions to include
4. Click **✓ Create Role**

### Example Roles

**Manager Role:**
- view_dashboard ✓
- pos_access ✓
- inventory_manage ✓
- customer_manage ✓
- sales_view ✓
- reports_view ✓
- settings_manage ✓
- users_manage ✓
- branch_manage ✓

**Cashier Role:**
- view_dashboard ✓
- pos_access ✓
- sales_view ✓

**Inventory Staff Role:**
- view_dashboard ✓
- inventory_manage ✓
- reports_view ✓

## Creating User Rules

### Step-by-Step Guide

1. Open **Settings** → **User Rules** → **Rules**
2. Click **+ Add New Rule**
3. Configure the rule:
   - **Rule Name**: Descriptive name
   - **Description**: Explain when this rule applies
   - **Condition**: JavaScript expression that evaluates user data
   - **Action**: Action to perform (assignRole, grantPermissions, etc.)
   - **Priority**: Execution order (higher = executed first)
4. Click **✓ Create Rule**

### Available Actions

- `assignRole`: Automatically assign a role to matching users
- `grantPermissions`: Grant specific permissions
- `restrict`: Restrict access based on conditions
- `notify`: Send notifications to administrators

### Rule Examples

**Example 1: Auto-promote Branch Managers**
```
Rule Name: Auto-assign Manager Role
Condition: position === 'Manager' && isActive === true
Action: Assign Role
Priority: 100
```

**Example 2: Restrict Inactive Users**
```
Rule Name: Restrict Inactive Users
Condition: isActive === false
Action: Restrict Access
Priority: 200
```

**Example 3: Grant Sales Permissions**
```
Rule Name: Grant Sales Team Access
Condition: position === 'Sales Associate'
Action: Grant Permissions
Priority: 50
```

## Rule Application

### How Rules Are Applied

1. **Automatic**: Rules execute when:
   - User logs in
   - User profile is updated
   - New rules are created
   - System runs scheduled checks

2. **Manual**: Administrators can trigger rules on demand
   - From the Rule Logs section
   - By clicking "Apply Rules Now"

3. **Scheduled**: Periodic rule evaluation (configurable)

### Application Process

1. Rules are sorted by priority (highest first)
2. For each rule, the condition is evaluated
3. If condition is true, the action is executed
4. Results are logged for audit trail
5. Failed rules don't stop subsequent rules

## Managing Rules and Roles

### Edit Role
1. Navigate to **Roles** tab
2. Find the role to edit
3. Click **Edit** button
4. Modify name, description, or permissions
5. Click **✓ Update Role**

### Edit Rule
1. Navigate to **Rules** tab
2. Find the rule to edit
3. Click **Edit** button
4. Modify any field
5. Click **✓ Update Rule**

### Delete Role
1. Click **Delete** button next to the role
2. Confirm the deletion

### Delete Rule
1. Click **Delete** button next to the rule
2. Confirm the deletion
3. Note: Deletes don't affect historical logs

## Monitoring and Logs

### View Application Logs
1. Navigate to **Settings** → **User Rules** → **Logs**
2. View all rule applications with:
   - Rule name
   - User affected
   - Application type
   - Success/failure status
   - Timestamp

### Filter Logs
- By specific rule
- By specific user
- By date range
- By status (success/failed)

## Advanced Features

### Conditional Expression Syntax

Rules support JavaScript expressions with access to user object:

```javascript
// Field access
user.position === 'Manager'
user.isActive === true
user.branchId === 'branch-123'

// Array operations
user.permissions.includes('admin')
user.position.startsWith('Sales')

// Logical operators
(user.position === 'Manager') && (user.isActive === true)
user.position === 'Manager' || user.position === 'Admin'

// Complex nested conditions
(user.position === 'Manager' || user.role === 'supervisor') && 
user.isActive === true && 
!user.onLeave === true
```

### Best Practices

1. **Keep Rules Simple**: Simple, clear conditions are easier to debug
2. **Use Priority Wisely**: Order rules logically
3. **Monitor Logs**: Regularly check logs for failed applications
4. **Document Rules**: Use descriptive names and clear descriptions
5. **Test Before Deploy**: Create rules in test mode first
6. **Avoid Conflicts**: Prevent rules that contradict each other

## Troubleshooting

### Rule Not Applying

**Check:**
1. Is the rule marked as Active?
2. Does the condition evaluate correctly?
3. Check logs for error messages
4. Verify the condition syntax

### Permission Not Granting

**Check:**
1. Is the role/permission spelling correct?
2. Are all required permissions selected?
3. Check if multiple rules conflict
4. Review rule priority order

### Performance Issues

**Solutions:**
1. Simplify complex conditions
2. Reduce number of active rules
3. Archive old rules
4. Review logs for failing rules

## API Reference

### Queries

```typescript
// Get all active rules
api.userRules.getAllRules()

// Get all roles
api.userRules.getAllRoles()

// Get permission templates
api.userRules.getPermissionTemplates(args: { category?: string })

// Get rule application logs
api.userRules.getRuleApplicationLogs(args: {
  ruleId?: Id<"userRules">,
  userId?: Id<"users">,
  limit?: number
})
```

### Mutations

```typescript
// Create rule
api.userRules.createRule(args: {
  name: string,
  description?: string,
  condition: string,
  action: string,
  priority: number
})

// Update rule
api.userRules.updateRule(args: {
  ruleId: Id<"userRules">,
  // ... same fields as create
})

// Delete rule
api.userRules.deleteRule(args: { ruleId: Id<"userRules"> })

// Create role
api.userRules.createRole(args: {
  name: string,
  description?: string,
  permissions: string[]
})

// Apply rules to user
api.userRules.applyRulesToUser(args: {
  userId: Id<"users">,
  userName?: string,
  applicationType?: string
})
```

## Database Schema

### Tables

#### `userRoles`
- `name`: string
- `description`: string (optional)
- `permissions`: array of strings
- `isActive`: boolean
- `createdAt`: number
- `updatedAt`: number

#### `userRules`
- `name`: string
- `description`: string (optional)
- `condition`: string (JavaScript expression)
- `action`: string
- `actionParams`: object (optional)
- `isActive`: boolean
- `priority`: number
- `createdAt`: number
- `updatedAt`: number

#### `ruleApplicationLog`
- `ruleId`: Id<userRules>
- `ruleName`: string
- `userId`: Id<users>
- `userName`: string
- `applicationType`: "auto" | "manual" | "scheduled"
- `result`: "success" | "failed" | "skipped"
- `resultMessage`: string (optional)
- `appliedAt`: number

#### `permissionTemplates`
- `name`: string
- `description`: string (optional)
- `permissions`: array of strings
- `category`: string
- `createdAt`: number

## Security Considerations

1. **Access Control**: Only admins can manage rules
2. **Audit Trail**: All rule applications are logged
3. **Validation**: All conditions are validated before execution
4. **Error Handling**: Failed rules are logged, not silently ignored
5. **Sandbox**: Condition evaluation is safely sandboxed

## Support and Feedback

For issues, questions, or feature requests:
- Contact support at support@example.com
- Report bugs in the system
- Provide feedback for improvements

## Changelog

### Version 1.0.0 (2026-01-28)
- Initial release of Rule-Based User Management
- Support for roles and rules
- Permission templates
- Application logging
- Dashboard integration
