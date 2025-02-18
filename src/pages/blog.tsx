import React from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BlogPage = () => {
  const posts = [
    {
      id: 1,
      title: "Top Investment Opportunities in Saudi Real Estate 2024",
      excerpt:
        "Discover the most promising areas for property investment in Saudi Arabia's growing market.",
      category: "Market Trends",
      author: "Ahmed Al-Saud",
      date: "March 15, 2024",
      imageUrl:
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop&q=60",
    },
    {
      id: 2,
      title: "Maximizing Your Property's Rental Income",
      excerpt:
        "Learn expert strategies to optimize your property's earning potential through smart management.",
      category: "Host Advice",
      author: "Sarah Johnson",
      date: "March 12, 2024",
      imageUrl:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=60",
    },
    {
      id: 3,
      title: "The Rise of Smart Homes in Saudi Arabia",
      excerpt:
        "How technology is transforming the Saudi property market and what it means for investors.",
      category: "Technology",
      author: "Mohammed Rahman",
      date: "March 10, 2024",
      imageUrl:
        "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=60",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Blog & Insights</h1>
              <p className="text-lg text-gray-600">
                Latest updates, market insights, and expert advice
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline">Subscribe</Button>
              <Button>Latest Posts</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-0">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-primary font-medium">
                        {post.category}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{post.date}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        By {post.author}
                      </span>
                      <Button variant="link" className="text-primary">
                        Read More
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default BlogPage;
