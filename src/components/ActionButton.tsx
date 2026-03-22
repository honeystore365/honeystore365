import { Button } from "@/components/ui/button"

interface ActionButtonProps {
  label: string
  icon?: React.ReactNode
  onClick: () => void
}

export function ActionButton({ label, icon, onClick }: ActionButtonProps) {
  return (
    <Button onClick={onClick}>
      {icon}
      {label}
    </Button>
  )
}