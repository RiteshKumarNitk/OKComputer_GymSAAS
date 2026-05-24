import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/common/PageHeader"

interface TabConfig {
  value: string
  label: string
}

interface PageWithTabsProps {
  title: string
  subtitle?: string
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (value: string) => void
  actions?: React.ReactNode
  children: React.ReactNode
}

export const PageWithTabs: React.FC<PageWithTabsProps> = ({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  actions,
  children,
}) => (
  <div className="space-y-6">
    <PageHeader title={title} subtitle={subtitle} actions={actions} />
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  </div>
)
