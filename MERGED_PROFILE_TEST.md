# Merged Profile Tab - Test Plan

## Overview
Test plan for the merged Profile tab that combines Profile and Account functionality for both Admin and Crew users.

## Implementation Summary

### Changes Made
- **Merged Components**: Created `MergedProfileTab.jsx` combining Profile and Account features
- **Role-Based Adaptation**: Single component that adapts based on `role` prop
- **Simplified Navigation**: Removed separate Account tabs, unified under Profile
- **Enhanced Functionality**: All profile/account features in one comprehensive tab
- **Responsive Design**: Navbar-aware responsive layout

## Test Scenarios

### 1. Navigation and Access

#### 1.1 Admin Navigation
**Test Steps:**
1. Sign in as Admin user
2. Navigate to Settings tab
3. Verify tabs: Users, Profile, Categories
4. Click on Profile tab
5. Verify MergedProfileTab renders with Admin features

**Expected Results:**
- Only 3 tabs visible (Users, Profile, Categories)
- Profile tab shows "Admin Profile Management" title
- Admin-specific features visible (Crown icons, admin status)
- No separate Account tab

#### 1.2 Crew Navigation
**Test Steps:**
1. Sign in as Crew user
2. Navigate to Settings tab
3. Verify only Profile tab visible
4. Click on Profile tab
5. Verify MergedProfileTab renders with Crew features

**Expected Results:**
- Only Profile tab visible for Crew users
- Profile tab shows "Profile Management" title
- Crew-specific features visible (User icons, crew status)
- All profile/account functionality in one tab

### 2. Profile Management Features

#### 2.1 Profile Information Card
**Test Steps:**
1. Navigate to Profile tab (both Admin and Crew)
2. Verify Profile Information card
3. Check form fields and labels
4. Test profile update functionality

**Expected Results:**
- **Admin**: "Admin Profile" card with "Admin Name" field
- **Crew**: "Profile Information" card with "Full Name" field
- Email field disabled for both with appropriate helper text
- Profile save functionality works correctly
- Appropriate icons (Crown for Admin, User for Crew)

#### 2.2 Account Status Card
**Test Steps:**
1. Review Account Status card
2. Verify account type display
3. Check email verification status
4. Verify last sign-in date
5. For Admin: check account creation date

**Expected Results:**
- **Admin**: "Admin Status" with "System Administrator" type, Crown icon
- **Crew**: "Account Status" with "Crew Member" type, CheckCircle icon
- Email verification status with appropriate icons
- Formatted dates for sign-in and creation (Admin only)
- Proper status styling and indicators

### 3. Security Settings

#### 3.1 Password Change
**Test Steps:**
1. Navigate to Security Settings section
2. Fill in password fields
3. Test validation
4. Submit password change
5. Verify success/error handling

**Expected Results:**
- Consistent password change functionality for both roles
- **Admin**: Enhanced helper text with security recommendations
- **Crew**: Standard password requirements
- Proper validation and error handling
- Success message on successful change

### 4. Account Actions

#### 4.1 Action Buttons
**Test Steps:**
1. Review Account Actions section
2. Verify Deactivate and Delete buttons
3. Check button states and styling
4. Test button interactions

**Expected Results:**
- Both Deactivate and Delete buttons available for both roles
- Proper button styling (warning for deactivate, danger for delete)
- Buttons disabled during other operations
- Smooth hover effects and transitions

#### 4.2 Deactivate Dialog
**Test Steps:**
1. Click Deactivate Account button
2. Verify dialog content and warnings
3. Check role-specific messaging
4. Test cancel and confirm actions

**Expected Results:**
- **Admin**: "Deactivate Admin Account" with admin-specific warnings
- **Crew**: "Deactivate Account" with standard messaging
- Appropriate role-specific content in dialog
- Cancel closes dialog, confirm triggers deactivation

#### 4.3 Delete Dialog
**Test Steps:**
1. Click Delete Account button
2. Verify enhanced warning dialog
3. Check role-specific warning lists
4. Verify admin-specific warnings

**Expected Results:**
- **Admin**: Enhanced warnings about system impact, admin-specific considerations
- **Crew**: Standard account deletion warnings
- Detailed warning lists with role-appropriate content
- **Admin**: Warning box about system operations below action buttons
- **Crew**: No warning box (admin-specific feature)

### 5. Responsive Design

#### 5.1 Navbar State Responsiveness
**Test Steps:**
1. Test with navbar expanded
2. Test with navbar collapsed
3. Verify layout adjustments
4. Check transitions

**Expected Results:**
- Layout adapts to navbar states using CSS selectors
- Smooth transitions between states
- Proper spacing adjustments
- No content overflow or layout breaks

#### 5.2 Screen Size Responsiveness
**Test Steps:**
1. Test on large screens (1200px+)
2. Test on medium screens (1024px-1199px)
3. Test on tablets (768px-1023px)
4. Test on mobile (<768px)

**Expected Results:**
- 2-column grid on large screens
- Responsive adjustments at breakpoints
- Single-column layout on smaller screens
- Touch-friendly mobile interface

### 6. Role-Based Differences

#### 6.1 Admin-Specific Features
**Test Steps:**
1. Sign in as Admin user
2. Check all role-specific elements
3. Verify admin styling and icons
4. Test admin-specific warnings

**Expected Results:**
- Crown icons for admin elements
- "System Administrator" status with red styling
- Admin-specific helper text and warnings
- Enhanced security recommendations
- Admin account creation date display

#### 6.2 Crew-Specific Features
**Test Steps:**
1. Sign in as Crew user
2. Check all role-specific elements
3. Verify crew styling and icons
4. Ensure no admin-specific features

**Expected Results:**
- User icons for crew elements
- "Crew Member" status with green styling
- Standard helper text and warnings
- No admin-specific features or warnings
- Clean, focused interface

### 7. Visual Design and Consistency

#### 7.1 Design Consistency
**Test Steps:**
1. Compare with other Settings tabs
2. Verify consistent styling
3. Check responsive behavior
4. Test animations and transitions

**Expected Results:**
- Consistent design language with other Settings tabs
- Proper use of design system components
- Smooth animations and transitions
- Responsive behavior matches other tabs

#### 7.2 Accessibility
**Test Steps:**
1. Test keyboard navigation
2. Verify focus management
3. Check screen reader compatibility
4. Test high contrast mode

**Expected Results:**
- Proper keyboard navigation
- Visible focus indicators
- Semantic HTML structure
- High contrast mode support

## Success Criteria

### Functional Requirements
- [ ] Merged Profile tab works for both Admin and Crew users
- [ ] All profile management features functional
- [ ] Password change functionality operational
- [ ] Account actions work with proper warnings
- [ ] Role-based adaptations correct

### Navigation Requirements
- [ ] Simplified Settings navigation (no separate Account tab)
- [ ] Proper tab organization by role
- [ ] Smooth tab switching
- [ ] Intuitive navigation structure

### Design Requirements
- [ ] Consistent design with other Settings tabs
- [ ] Role-specific visual elements
- [ ] Responsive design across all screen sizes
- [ ] Navbar state responsiveness

### User Experience Requirements
- [ ] Unified profile/account management experience
- [ ] Clear role-based differences
- [ ] Proper error handling and feedback
- [ ] Accessible design

## Test Matrix

| Feature | Admin User | Crew User | Expected Behavior |
|---------|------------|-----------|------------------|
| Profile Tab Title | "Admin Profile Management" | "Profile Management" | Role-specific titles |
| Profile Card | "Admin Profile" with Crown | "Profile Information" with User | Different icons and labels |
| Status Card | "Admin Status" with admin details | "Account Status" with crew details | Role-specific content |
| Security Settings | Enhanced recommendations | Standard requirements | Different helper text |
| Account Actions | Admin-specific warnings | Standard warnings | Role-appropriate warnings |
| Navigation | Users, Profile, Categories | Profile only | Different tab sets |

## Validation Checklist

### Before Release
- [ ] Manual testing on all features completed
- [ ] Both Admin and Crew roles tested
- [ ] Responsive design verified
- [ ] Cross-browser compatibility checked
- [ ] Error handling scenarios tested

### Post-Release
- [ ] Monitor for any issues with merged functionality
- [ ] Collect user feedback from both roles
- [ ] Track usage patterns
- [ ] Address any reported issues

## Benefits Achieved

### Improved User Experience
- **Unified Interface**: All profile/account features in one place
- **Reduced Redundancy**: No duplicate profile/password sections
- **Simpler Navigation**: Fewer tabs to navigate
- **Logical Grouping**: All personal account management together

### Enhanced Functionality
- **Comprehensive Management**: All profile features in single tab
- **Role-Based Adaptation**: Single component serving both roles
- **Consistent Experience**: Unified interface across roles
- **Better Organization**: Logical feature grouping

### Development Benefits
- **Reduced Complexity**: Single component instead of multiple
- **Easier Maintenance**: One codebase for profile features
- **Consistent Styling**: Unified design system
- **Better Testing**: Single component to test for both roles
