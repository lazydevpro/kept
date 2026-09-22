import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { NetworkProvider } from '@/features/network/network-provider'
import { MobileWalletProvider } from '@wallet-ui/react-native-kit'
import { AppConfig } from '@/constants/app-config'
import { SessionBootstrap } from '@/features/session/session-bootstrap'
import { WidgetSync } from '@/features/widget/widget-sync'
import { ThemeProvider } from '@/components/theme-provider'
import { NotificationBootstrap } from '@/features/notifications/notification-bootstrap'
import { SettlementProvider } from '@/features/trade/settlement'

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
                {/* Above the screens so a settled purchase still lands after the
                    sheet has closed and the reader has changed tabs. */}
                <SettlementProvider>{children}</SettlementProvider>
              </MobileWalletProvider>
            )}
          />
        </SessionBootstrap>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
