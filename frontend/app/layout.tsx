export const metadata = { title: "Aegis", description: "Deploy ONNX models as APIs" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
