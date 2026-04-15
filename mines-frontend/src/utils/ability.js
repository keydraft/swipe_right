import { AbilityBuilder, createMongoAbility } from '@casl/ability';

export const defineAbilitiesFor = (permissions = [], role = '') => {
  const { can, rules } = new AbilityBuilder(createMongoAbility);

  // Normalize role string
  const normalizedRole = role ? role.toUpperCase() : '';

  if (normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER' || normalizedRole === 'SITE MANAGER' || permissions.includes('ADMIN')) {
    can('manage', 'all');
  } else {
    permissions.forEach(permission => {
      // Mapping backend permissions to CASL actions and subjects
      // Format example: READ_COMPANY -> can('read', 'Company')
      const permissionParts = permission.split('_');
      if (permissionParts.length < 2) return;

      const action = permissionParts[0].toLowerCase();
      let caslAction = action === 'write' ? 'manage' : action;
      
      const subject = permissionParts.slice(1).join('_');
      let caslSubject = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
      
      can(caslAction, caslSubject);
    });
    
    // Default access to ensure side menu items are visible for all roles
    can('read', 'all');
  }

  return createMongoAbility(rules);
};

export const ability = defineAbilitiesFor([], '');
