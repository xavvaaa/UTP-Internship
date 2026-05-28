/**
 * Settings Tab
 * Role-based settings with tabs for:
 * Admin: User & Role Management, Profile Settings, Menu Categories
 * Crew: Profile Settings
 */
import { useMemo, useState } from 'react'
import { Users, User, FolderOpen } from 'lucide-react'
import UserManagementTab from './UserManagementTab'
import MergedProfileTab from './MergedProfileTab'
import MenuCategoriesTab from './MenuCategoriesTab'
import styles from './SettingsTab.module.css'

const ADMIN_SETTING_TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
]

const CREW_SETTING_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
]

export default function SettingsTab({ role }) {
  const [activeTab, setActiveTab] = useState(role === 'admin' ? 'users' : 'profile')

  const settingTabs = role === 'admin' ? ADMIN_SETTING_TABS : CREW_SETTING_TABS

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case 'users':
        return <UserManagementTab />
      case 'profile':
        return <MergedProfileTab role={role} />
      case 'categories':
        return <MenuCategoriesTab />
      default:
        return role === 'admin' ? <UserManagementTab /> : <MergedProfileTab role={role} />
    }
  }, [activeTab, role])

  return (
    <div className={styles.container}>
      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {settingTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${isActive ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <Icon size={18} />
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>{renderContent}</div>
    </div>
  )
}