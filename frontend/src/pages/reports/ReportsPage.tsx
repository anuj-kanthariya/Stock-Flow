import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { salesData, categoryDistribution } from "@/data/dummy";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, IndianRupee, Package, Users } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const topProducts = [
  { name: "Apple iPhone 15 Pro Max", revenue: 7_02_650, units: 5 },
  { name: "Samsung 65\" QLED 4K TV", revenue: 1_48_000, units: 2 },
  { name: "Bosch Drill Machine", revenue: 38_000, units: 10 },
  { name: "Basmati Rice 25kg", revenue: 46_500, units: 30 },
  { name: "Classmate Notebooks", revenue: 25_200, units: 200 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-4 md:space-y-5 flex flex-col h-full w-full pb-24 md:pb-0">
      <div className="hidden md:block">
        <PageHeader
          title="Reports & Analytics"
          description="Business insights and performance metrics"
          breadcrumbs={[{ label: "Reports" }]}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="Revenue (Aug)"
          value={formatCurrency(6_820_000)}
          icon={<IndianRupee className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/10"
          change={19.4}
          changeLabel="vs Jul"
        />
        <StatsCard
          title="Orders (Aug)"
          value={formatNumber(856)}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          change={10.6}
          changeLabel="vs Jul"
        />
        <StatsCard
          title="Avg Order Value"
          value={formatCurrency(7_969)}
          icon={<Package className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          change={8.1}
          changeLabel="vs Jul"
        />
        <StatsCard
          title="Active Customers"
          value={formatNumber(304)}
          icon={<Users className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          change={5.2}
          changeLabel="vs Jul"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="revenue">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue trend over last 7 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                      formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(221,83%,53%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Orders</CardTitle>
                <CardDescription>Order volume trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                      formatter={(v: number) => [v, "Orders"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="hsl(142,71%,45%)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>By revenue this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-muted-foreground w-5 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium truncate">{p.name}</span>
                      <span className="text-sm font-semibold text-primary ml-2 flex-shrink-0">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-primary transition-all duration-500"
                          style={{
                            width: `${(p.revenue / topProducts[0].revenue) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {p.units} units
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Category distribution this month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                      formatter={(v: number) => [`${v}%`, ""]}
                    />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryDistribution.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm flex-1">{cat.name}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.value}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">
                      {cat.value}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
