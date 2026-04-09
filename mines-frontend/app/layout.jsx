import { ThemeRegistry } from "@/theme";
import "./globals.css";
import { AbilityProvider } from "@/context/AbilityContext";
import { AppProvider } from "@/context/AppContext";

export const metadata = {
    title: "Swipe Right",
    description: "Swipe Right — Smart business management platform",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link
                    rel="preconnect"
                    href="https://fonts.googleapis.com"
                />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400,300&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <AppProvider>
                    <AbilityProvider>
                        <ThemeRegistry>{children}</ThemeRegistry>
                    </AbilityProvider>
                </AppProvider>
            </body>
        </html>
    );
}
