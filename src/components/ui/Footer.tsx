import { Container } from '@/components/ui/Container';

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <Container className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Hexora. Video games for PC and console.</p>
        <p>Digital delivery and courier shipping.</p>
      </Container>
    </footer>
  );
}
