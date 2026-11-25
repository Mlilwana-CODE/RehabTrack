import DashboardInsights from '@/components/DashboardInsights';
import RehabilitationProgressWidget from '@/components/RehabilitationProgressWidget';
export default function DashboardLayout({children}:{children:React.ReactNode}){return <><DashboardInsights/><RehabilitationProgressWidget/>{children}</>}
