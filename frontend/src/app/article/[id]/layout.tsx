import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Article - Reapublix',
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
