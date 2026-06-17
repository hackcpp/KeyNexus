type TabDef<T extends string = string> = {
  label: string
  value: T
  disabled?: boolean
}

type TabsProps<T extends string = string> = {
  tabs: TabDef<T>[]
  activeValue: T
  onTabChange: (value: T) => void
}

export function Tabs<T extends string = string>({ tabs, activeValue, onTabChange }: TabsProps<T>) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={`tab ${tab.value === activeValue ? 'active' : ''}`}
          disabled={tab.disabled}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
