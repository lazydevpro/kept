import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { NetworkProvider } from '@/features/network/network-provider'
import { MobileWalletProvider } from '@wallet-ui/react-native-kit'
import { AppConfig } from '@/constants/app-config'
import { SessionBootstrap } from '@/features/session/session-bootstrap'
import { WidgetSync } from '@/features/widget/widget-sync'
import { ThemeProvider } from '@/components/theme-provider'
import { NotificationBootstrap } from '@/features/notifications/notification-bootstrap'

const queryClient = new QueryClient()
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap>
          <NotificationBootstrap />
          <WidgetSync />
          <NetworkProvider
            networks={AppConfig.networks}
            render={({ selectedNetwork }) => (
              <MobileWalletProvider cluster={selectedNetwork} identity={AppConfig.identity}>
                {children}
              </MobileWalletProvider>
            )}
          />
        </SessionBootstrap>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
