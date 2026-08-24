import {
  Package,
  Boxes,
  TrendingUp,
  IndianRupee,
  AlertTriangle,
  Users,
  FileText,
  ShoppingCart,
  Tag,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/shared/DataTable";
import { InvoiceStatusBadge } from "@/components/shared/InvoiceStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  dashboardStats,
  salesData,
  categoryDistribution,
  invoices,
  lowStockProducts,
} from "@/data/dummy";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Invoice, Product } from "@/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createPortal } from "react-dom";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Extracting charts to avoid duplication
  const revenueChart = (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue for the last 7 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={salesData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [
                formatCurrency(value),
                "Revenue",
              ]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const categoryChart = (
    <Card>
      <CardHeader>
        <CardTitle>Category Distribution</CardTitle>
        <CardDescription>Sales by category this month</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={categoryDistribution}
              cx="50%"
              cy="45%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {categoryDistribution.map((_, index) => {
                const colors = [
                  "hsl(var(--primary))",
                  "hsl(271, 71%, 59%)",
                  "hsl(150, 66%, 40%)",
                  "hsl(39, 77%, 52%)",
                  "hsl(var(--muted-foreground))"
                ];
                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const recentInvoicesTable = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Latest billing activity</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/invoices">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable<Invoice>
          columns={[
            {
              key: "invoiceNumber",
              header: "Invoice",
              render: (row) => (
                <span className="font-medium text-primary text-xs">
                  {row.invoiceNumber}
                </span>
              ),
            },
            { key: "customerName", header: "Customer" },
            {
              key: "total",
              header: "Amount",
              render: (row) => (
                <span className="font-semibold">
                  {formatCurrency(row.total)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => <InvoiceStatusBadge status={row.status} />,
            },
          ]}
          data={invoices.slice(0, 5)}
          keyExtractor={(row) => row.id}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full">
      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:flex flex-col space-y-6 w-full">
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${user?.name ? user.name.split(" ")[0] : "User"}! Here's what's happening today.`}
          breadcrumbs={[{ label: "Dashboard" }]}
          actions={
            <Button asChild>
              <Link to="/billing">
                <ShoppingCart className="h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Products"
            value={formatNumber(dashboardStats.totalProducts)}
            icon={<Package className="h-5 w-5 text-primary" />}
            iconBg="bg-primary/10"
            change={4.2}
            changeLabel="vs last month"
          />
          <StatsCard
            title="Total Categories"
            value={formatNumber(dashboardStats.totalCategories)}
            icon={<Tag className="h-5 w-5 text-blue-500" />}
            iconBg="bg-blue-500/10"
            description="Active categories"
          />
          <StatsCard
            title="Total stockQuantity"
            value={formatNumber(dashboardStats.totalStock)}
            icon={<Boxes className="h-5 w-5 text-purple-500" />}
            iconBg="bg-purple-500/10"
            change={-1.8}
            changeLabel="vs last month"
          />
          <StatsCard
            title="Today's Sales"
            value={formatCurrency(dashboardStats.todaySales)}
            icon={<IndianRupee className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            change={12.5}
            changeLabel="vs yesterday"
          />
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(dashboardStats.monthlyRevenue)}
            icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
            iconBg="bg-amber-500/10"
            change={19.4}
            changeLabel="vs last month"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Low stockQuantity Items"
            value={dashboardStats.lowStockItems}
            icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
            iconBg="bg-destructive/10"
            description="Needs attention"
          />
          <StatsCard
            title="Total Customers"
            value={formatNumber(dashboardStats.totalCustomers)}
            icon={<Users className="h-5 w-5 text-blue-500" />}
            iconBg="bg-blue-500/10"
            change={8.3}
            changeLabel="vs last month"
          />
          <StatsCard
            title="Pending Invoices"
            value={dashboardStats.pendingInvoices}
            icon={<FileText className="h-5 w-5 text-primary" />}
            iconBg="bg-primary/10"
            description="Awaiting payment"
          />
          <StatsCard
            title="Monthly Orders"
            value={formatNumber(dashboardStats.monthlyOrders)}
            icon={<ShoppingCart className="h-5 w-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            change={10.6}
            changeLabel="vs last month"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {revenueChart}
          {categoryChart}
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recentInvoicesTable}

          {/* Low stockQuantity Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Low stockQuantity Alert</CardTitle>
                <CardDescription>Products below minimum threshold</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/products">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable<Product>
                columns={[
                  { key: "name", header: "Product" },
                  {
                    key: "categoryName",
                    header: "Category",
                    render: (row) => (
                      <Badge variant="secondary" className="text-xs">
                        {row.categoryName}
                      </Badge>
                    ),
                  },
                  {
                    key: "stockQuantity",
                    header: "stockQuantity",
                    render: (row) => (
                      <span className="font-semibold text-destructive">
                        {row.stockQuantity} {row.unit}
                      </span>
                    ),
                  },
                  {
                    key: "minimumStock",
                    header: "Min stockQuantity",
                    render: (row) => (
                      <span className="text-muted-foreground">{row.minimumStock}</span>
                    ),
                  },
                ]}
                data={lowStockProducts}
                keyExtractor={(row) => row.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* --- MOBILE VIEW --- */}
      <div className="flex md:hidden flex-col space-y-4 w-full pb-4">
        {/* Welcome Section */}
        <div className="flex flex-col mb-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name ? user.name.split(" ")[0] : "User"}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dashboard - Here's what's happening today.
          </p>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Total Products"
            value={formatNumber(dashboardStats.totalProducts)}
            icon={<Package className="h-4 w-4 text-primary" />}
            iconBg="bg-primary/10"
            change={4.2}
            compact
          />
          <StatsCard
            title="Total Categories"
            value={formatNumber(dashboardStats.totalCategories)}
            icon={<Tag className="h-4 w-4 text-blue-500" />}
            iconBg="bg-blue-500/10"
            description="Active categories"
            compact
          />
        </div>

        {/* Two-Column Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(dashboardStats.monthlyRevenue)}
            icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
            iconBg="bg-amber-500/10"
            change={19.4}
            compact
          />
          <StatsCard
            title="Total Stock"
            value={formatNumber(dashboardStats.totalStock)}
            icon={<Boxes className="h-4 w-4 text-purple-500" />}
            iconBg="bg-purple-500/10"
            change={-1.8}
            compact
          />
        </div>

        {/* Low Stock Alert */}
        <StatsCard
          title="Low Stock Quantity"
          value={dashboardStats.lowStockItems}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          iconBg="bg-destructive/10"
          description="Needs attention"
        />

        {/* Recent Invoices */}
        <div className="pt-2">
          {recentInvoicesTable}
        </div>

        {/* Charts */}
        <div className="pt-2 flex flex-col gap-4">
          {revenueChart}
        </div>

        {/* Mobile Floating Action Button (FAB) mounted via Portal to escape transform/overflow trapping */}
        {createPortal(
          <Button 
            asChild 
            size="icon" 
            className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 z-[100] md:hidden"
          >
            <Link to="/billing">
              <Plus className="h-6 w-6" />
              <span className="sr-only">New Invoice</span>
            </Link>
          </Button>,
          document.body
        )}
      </div>
    </div>
  );
}
