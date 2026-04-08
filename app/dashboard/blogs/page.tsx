import sql from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, TrendingUp, BookOpen, Calendar } from "lucide-react";

async function getBlogStats() {
  try {
    const posts = await sql`
      SELECT slug, title, category, publish_date, views, last_viewed
      FROM blog_stats
      ORDER BY views DESC
    `;
    const [totals] = await sql`
      SELECT COALESCE(SUM(views), 0) as total_views, COUNT(*) as total_posts
      FROM blog_stats
    `;
    return { posts, totalViews: Number(totals.total_views), totalPosts: Number(totals.total_posts) };
  } catch {
    return { posts: [], totalViews: 0, totalPosts: 0 };
  }
}

export default async function BlogsPage() {
  const { posts, totalViews, totalPosts } = await getBlogStats();
  const topPost = posts[0] ?? null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Blog statistieken</h1>
        <p className="text-white/50 text-sm mt-1">Paginaweergaves per artikel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Totaal views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{totalViews.toLocaleString("nl-NL")}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Artikelen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{totalPosts}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Meest gelezen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-[#00D4AA] leading-tight truncate">
              {topPost ? `${topPost.views} views` : "—"}
            </p>
            {topPost && (
              <p className="text-xs text-white/40 mt-0.5 truncate">{topPost.title}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Gem. per artikel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Alle artikelen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <p className="text-white/40 text-sm p-6 text-center">
              Nog geen blog views ontvangen. Views worden automatisch bijgehouden zodra bezoekers artikelen lezen.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-white/40 font-medium px-6 py-3">Artikel</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Categorie</th>
                    <th className="text-right text-xs text-white/40 font-medium px-4 py-3">Views</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Gepubliceerd</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Laatste view</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, i) => (
                    <tr key={post.slug} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-white/20 w-5 text-right flex-shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <a
                              href={`https://mindbuild.nl/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white font-medium hover:text-[#00D4AA] transition-colors truncate block max-w-[320px]"
                            >
                              {post.title}
                            </a>
                            <p className="text-xs text-white/30 font-mono">/blog/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {post.category ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] font-medium">
                            {post.category}
                          </span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-lg font-bold text-white">{post.views.toLocaleString("nl-NL")}</span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {post.publish_date
                          ? new Date(post.publish_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {new Date(post.last_viewed).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
