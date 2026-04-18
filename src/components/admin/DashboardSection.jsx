import React from 'react';
import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Avatar,
  LinearProgress,
  Button,
  Tooltip,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { computeDashboardStats, findLowStockProducts } from '../../lib/adminService';

const fontFamily = '"Georgia", serif';

/* ─── Sub-components ─── */

function GreetingBanner() {
  const hour = new Date().getHours();
  const greeting =
		hour < 12
			? "Good morning Titi"
			: hour < 17
				? "Good afternoon Titi"
				: "Good evening Titi";
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
		<Box
			sx={{
				background: "linear-gradient(135deg, #007a7a 0%, #e3242b 100%)",
				borderRadius: 3,
				p: { xs: 3, md: 4 },
				mb: 3,
				color: "#fff",
			}}
		>
			<Typography
				sx={{
					fontFamily,
					fontWeight: 700,
					fontSize: { xs: "1.4rem", md: "1.8rem" },
				}}
			>
				{greeting}
			</Typography>
			<Typography
				sx={{ fontFamily, fontSize: "0.95rem", opacity: 0.85, mt: 0.5 }}
			>
				{today}
			</Typography>
		</Box>
  );
}

function StatCard({ title, value, icon, gradient, onClick }) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: { xs: 2, md: 2.5 },
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1.5, md: 2 },
        borderRadius: 3,
        background: gradient,
        color: '#fff',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        overflow: 'hidden',
        '&:hover': onClick
          ? { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }
          : {},
      }}
    >
      <Box
        sx={{
          width: { xs: 40, md: 46 },
          height: { xs: 40, md: 46 },
          flexShrink: 0,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily, fontSize: { xs: '0.72rem', md: '0.82rem' }, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </Typography>
        <Typography sx={{ fontFamily, fontWeight: 700, fontSize: { xs: '1.2rem', md: '1.4rem' } }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

function SectionHeader({ title, icon, onViewAll }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.1rem' }}>{title}</Typography>
      </Box>
      {onViewAll && (
        <Button
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={onViewAll}
          sx={{ fontFamily, textTransform: 'none', color: 'var(--text-purple)' }}
        >
          View All
        </Button>
      )}
    </Box>
  );
}


function LowStockCard({ product }) {
  const { name, stock, categoryName } = product;
  const severe = stock <= 2;
  const maxStock = 5;
  const progress = (stock / maxStock) * 100;

  return (
    <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.9rem', minWidth: 0 }} noWrap>
          {name}
        </Typography>
        <Chip
          label={`${stock} left`}
          size="small"
          sx={{
            fontFamily,
            fontSize: '0.75rem',
            bgcolor: severe ? '#ffebee' : '#fff3e0',
            color: severe ? '#d32f2f' : '#e65100',
            fontWeight: 600,
            flexShrink: 0,
            ml: 1,
          }}
        />
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: severe ? '#ffcdd2' : '#ffe0b2',
          '& .MuiLinearProgress-bar': {
            bgcolor: severe ? '#d32f2f' : '#e65100',
            borderRadius: 3,
          },
          mb: 0.5,
        }}
      />
      <Typography sx={{ fontFamily, fontSize: '0.75rem', color: '#999' }}>{categoryName}</Typography>
    </Paper>
  );
}

function MiniBarChart({ title, data, color, prefix = '' }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 120 }}>
        {data.map((d, i) => (
          <Tooltip key={i} title={`${d.label}: ${prefix}${d.value.toLocaleString()}`} arrow>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 40,
                  height: `${Math.max((d.value / max) * 100, 4)}%`,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease',
                  '&:hover': { opacity: 0.8 },
                }}
              />
              <Typography sx={{ fontSize: '0.65rem', color: '#999', mt: 0.5, fontFamily }}>
                {d.label}
              </Typography>
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Paper>
  );
}

function QuickActionsPanel({ onNavigate }) {
  const actions = [
		{
			label: "New Order",
			icon: <AddCircleOutlineIcon />,
			section: "orders",
			color: "var(--text-purple)",
		},
		{
			label: "Collections",
			icon: <EventNoteIcon />,
			section: "collections",
			color: "#e3242b",
		},
		{
			label: "Production Queue",
			icon: <InventoryIcon />,
			section: "production",
			color: "#2e7d32",
		},
		{
			label: "Gift Cards",
			icon: <CardGiftcardIcon />,
			section: "giftcards",
			color: "#e65100",
		},
  ];

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
      <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={1.5}>
        {actions.map((a) => (
          <Grid item xs={6} key={a.section}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={a.icon}
              onClick={() => onNavigate(a.section)}
              sx={{
                fontFamily,
                textTransform: 'none',
                borderColor: a.color,
                color: a.color,
                borderRadius: 2,
                py: 1.2,
                fontSize: '0.8rem',
                '&:hover': { bgcolor: `${a.color}10`, borderColor: a.color },
              }}
            >
              {a.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

function LowStockAlertBanner({ items, onNavigate }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || items.length === 0) return null;
  return (
		<Box
			sx={{
				mb: 2,
				p: 2,
				borderRadius: 2,
				backgroundColor: "#fff3e0",
				border: "1.5px solid #fb8c00",
				display: "flex",
				alignItems: "flex-start",
				gap: 1.5,
			}}
		>
			<WarningAmberIcon sx={{ color: "#e65100", mt: 0.3, flexShrink: 0 }} />
			<Box sx={{ flex: 1, minWidth: 0 }}>
				<Typography
					sx={{
						fontFamily,
						fontWeight: 700,
						fontSize: "0.92rem",
						color: "#e65100",
						mb: 0.5,
					}}
				>
					Low Stock Alert — {items.length} product
					{items.length !== 1 ? "s" : ""} running low
				</Typography>
				<Typography
					sx={{
						fontFamily,
						fontSize: "0.8rem",
						color: "var(--text-muted)",
					}}
				>
					{items
						.slice(0, 3)
						.map((p) => `${p.name} (${p.stock} left)`)
						.join(" · ")}
					{items.length > 3 ? ` · +${items.length - 3} more` : ""}
				</Typography>
			</Box>
			<Box
				sx={{
					display: "flex",
					gap: 1,
					alignItems: "center",
					flexShrink: 0,
				}}
			>
				<Button
					size="small"
					onClick={() => onNavigate && onNavigate("production")}
					sx={{
						fontFamily,
						textTransform: "none",
						color: "#e65100",
						fontWeight: 600,
						fontSize: "0.78rem",
						px: 1,
					}}
				>
					Manage
				</Button>
				<Button
					size="small"
					onClick={() => setDismissed(true)}
					sx={{
						fontFamily,
						textTransform: "none",
						color: "#999",
						fontSize: "0.78rem",
						px: 1,
						minWidth: 0,
					}}
				>
					Dismiss
				</Button>
			</Box>
		</Box>
  );
}

/* ─── Status colors ─── */

const statusColor = {
  pending: 'warning',
  confirmed: 'info',
  production: 'secondary',
  shipping: 'primary',
  received: 'success',
};

/* ─── Main component ─── */

export default function DashboardSection({
  orders,
  pressOnCategories,
  retailCategories,
  customerCount,
  loading,
  onNavigate,
}) {
  const chartData = useMemo(() => {
    if (!orders.length) return { ordersData: [], revenueData: [], monthlyData: [] };

    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        orders: 0,
        revenue: 0,
      });
    }

    const REVENUE_STATUSES = ['confirmed', 'received', 'completed'];
    orders.forEach((o) => {
      const created = o.createdAt?.toDate ? o.createdAt.toDate() : null;
      if (!created) return;
      const key = created.toISOString().split('T')[0];
      const day = days.find((d) => d.date === key);
      if (day) {
        day.orders += 1;
        if (REVENUE_STATUSES.includes(o.status)) day.revenue += (o.total || 0) + (o.extraCharge || 0);
      }
    });

    // Monthly revenue — last 6 months
    const months = [];
    const now2 = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleDateString('en-GB', { month: 'short' }),
        revenue: 0,
        orders: 0,
      });
    }
    orders.forEach((o) => {
      const created = o.createdAt?.toDate ? o.createdAt.toDate() : null;
      if (!created) return;
      const mo = months.find((m) => m.year === created.getFullYear() && m.month === created.getMonth());
      if (mo) { mo.orders += 1; if (REVENUE_STATUSES.includes(o.status)) mo.revenue += (o.total || 0) + (o.extraCharge || 0); }
    });

    return {
      ordersData: days.map((d) => ({ label: d.label, value: d.orders })),
      revenueData: days.map((d) => ({ label: d.label, value: d.revenue })),
      monthlyData: months.map((m) => ({ label: m.label, value: m.revenue, orders: m.orders })),
    };
  }, [orders]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3, mb: 2 }} />
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3, mb: 2 }} />
            <Skeleton variant="rounded" height={150} sx={{ borderRadius: 3, mb: 2 }} />
            <Skeleton variant="rounded" height={150} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const stats = computeDashboardStats(orders);
  const productOrders = orders.filter((o) => o.type !== 'service');
  const allCategories = [...pressOnCategories, ...retailCategories];
  const lowStock = findLowStockProducts(allCategories).sort((a, b) => a.stock - b.stock);
  const recentOrders = orders.slice(0, 3);

  const statCards = [
		{
			title: "Total Orders",
			value: productOrders.length,
			icon: <ShoppingCartIcon />,
			gradient: "linear-gradient(135deg, #007a7a 0%, #7B1FA2 100%)",
			section: "orders",
		},
		{
			title: "Revenue",
			value: `₦${stats.revenue.toLocaleString()}`,
			icon: <AttachMoneyIcon />,
			gradient: "linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)",
			section: "orders",
		},
		{
			title: "Pending",
			value: stats.pending,
			icon: <PendingActionsIcon />,
			gradient: "linear-gradient(135deg, #e65100 0%, #fb8c00 100%)",
			section: "orders",
		},
		{
			title: "Customers",
			value: customerCount || 0,
			icon: <PeopleIcon />,
			gradient: "linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)",
			section: "customers",
		},
		{
			title: "Production Queue",
			value: stats.production,
			icon: <WarningAmberIcon />,
			gradient: "linear-gradient(135deg, #c62828 0%, #ef5350 100%)",
			section: "production",
		},
  ];

  return (
		<Box>
			<GreetingBanner />
			<LowStockAlertBanner
				items={lowStock.filter((p) => p.stock <= 2)}
				onNavigate={onNavigate}
			/>

			{/* Stat Cards */}
			<Grid container spacing={2} sx={{ mb: 3 }}>
				{statCards.map((s) => (
					<Grid item xs={6} sm={4} md key={s.title} sx={{ minWidth: 0 }}>
						<StatCard
							title={s.title}
							value={s.value}
							icon={s.icon}
							gradient={s.gradient}
							onClick={
								onNavigate ? () => onNavigate(s.section) : undefined
							}
						/>
					</Grid>
				))}
			</Grid>

			{/* Two-column layout */}
			<Grid container spacing={3}>
				{/* Left column: Charts + Orders table */}
				<Grid item xs={12} md={8}>
					<Grid container spacing={2} sx={{ mb: 2 }}>
						<Grid item xs={12} sm={6}>
							<MiniBarChart
								title="Orders (Last 7 Days)"
								data={chartData.ordersData}
								color="#007a7a"
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<MiniBarChart
								title="Revenue (Last 7 Days)"
								data={chartData.revenueData}
								color="#2e7d32"
								prefix="₦"
							/>
						</Grid>
					</Grid>

					<Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								mb: 2,
							}}
						>
							<Typography
								sx={{
									fontFamily,
									fontWeight: 700,
									fontSize: "0.95rem",
								}}
							>
								Monthly Revenue (Last 6 Months)
							</Typography>
							<Typography
								sx={{
									fontFamily,
									fontSize: "0.78rem",
									color: "#2e7d32",
									fontWeight: 600,
								}}
							>
								Total: ₦
								{chartData.monthlyData
									.reduce((s, m) => s + m.value, 0)
									.toLocaleString()}
							</Typography>
						</Box>
						<Box
							sx={{
								display: "flex",
								alignItems: "flex-end",
								gap: 1,
								height: 120,
							}}
						>
							{chartData.monthlyData.map((m, i) => {
								const maxVal = Math.max(
									...chartData.monthlyData.map((d) => d.value),
									1,
								);
								const isCurrentMonth =
									i === chartData.monthlyData.length - 1;
								return (
									<Tooltip
										key={i}
										title={`${m.label}: ₦${m.value.toLocaleString()} (${m.orders} orders)`}
										arrow
									>
										<Box
											sx={{
												flex: 1,
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												height: "100%",
												justifyContent: "flex-end",
											}}
										>
											<Box
												sx={{
													width: "100%",
													maxWidth: 40,
													height: `${Math.max((m.value / maxVal) * 100, 4)}%`,
													background: isCurrentMonth
														? "linear-gradient(180deg, #2e7d32 0%, #66bb6a 100%)"
														: "linear-gradient(180deg, #a5d6a7 0%, #c8e6c9 100%)",
													borderRadius: "4px 4px 0 0",
													transition: "height 0.3s ease",
													"&:hover": { opacity: 0.8 },
												}}
											/>
											<Typography
												sx={{
													fontSize: "0.65rem",
													color: isCurrentMonth
														? "#2e7d32"
														: "#999",
													mt: 0.5,
													fontFamily,
													fontWeight: isCurrentMonth ? 700 : 400,
												}}
											>
												{m.label}
											</Typography>
										</Box>
									</Tooltip>
								);
							})}
						</Box>
					</Paper>

					<SectionHeader
						title="Recent Orders"
						icon={
							<ShoppingCartIcon sx={{ color: "var(--text-purple)" }} />
						}
						onViewAll={
							onNavigate ? () => onNavigate("orders") : undefined
						}
					/>
					<TableContainer component={Paper} sx={{ borderRadius: 3 }}>
						<Table size="small">
							<TableHead>
								<TableRow sx={{ backgroundColor: "#007a7a" }}>
									{[
										"#",
										"Customer",
										"Type",
										"Status",
										"Total",
										"Date",
									].map((h) => (
										<TableCell
											key={h}
											sx={{
												color: "#fff",
												fontFamily,
												fontWeight: 700,
											}}
										>
											{h}
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{recentOrders.map((o, idx) => {
									const customerName = o.customerName || o.name || "—";
									const initials =
										customerName !== "—"
											? customerName
													.split(" ")
													.map((n) => n[0])
													.join("")
													.toUpperCase()
													.slice(0, 2)
											: "?";
									return (
										<TableRow
											key={o.id}
											sx={{ "&:hover": { bgcolor: "#f3e5f5" } }}
										>
											<TableCell
												sx={{
													fontFamily,
													fontSize: "0.78rem",
													color: "#999",
													width: 32,
												}}
											>
												{idx + 1}
											</TableCell>
											<TableCell sx={{ fontFamily }}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1.5,
													}}
												>
													<Avatar
														sx={{
															width: 32,
															height: 32,
															bgcolor: "var(--text-purple)",
															fontSize: "0.75rem",
															fontFamily,
															fontWeight: 700,
														}}
													>
														{initials}
													</Avatar>
													<Box>
														<Typography
															sx={{
																fontFamily,
																fontSize: "0.85rem",
																fontWeight: 600,
															}}
														>
															{customerName}
														</Typography>
														<Typography
															sx={{
																fontFamily,
																fontSize: "0.7rem",
																color: "#999",
															}}
														>
															{o.id.slice(0, 8)}...
														</Typography>
													</Box>
												</Box>
											</TableCell>
											<TableCell sx={{ fontFamily }}>
												<Chip label={o.type || "—"} size="small" />
											</TableCell>
											<TableCell>
												<Chip
													label={o.status || "pending"}
													size="small"
													color={
														statusColor[o.status] || "default"
													}
												/>
											</TableCell>
											<TableCell sx={{ fontFamily }}>
												₦{(o.total || 0).toLocaleString()}
											</TableCell>
											<TableCell
												sx={{ fontFamily, fontSize: "0.8rem" }}
											>
												{o.createdAt?.toDate
													? o.createdAt
															.toDate()
															.toLocaleDateString()
													: "—"}
											</TableCell>
										</TableRow>
									);
								})}
								{recentOrders.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={6}
											sx={{ textAlign: "center", fontFamily, py: 3 }}
										>
											No orders yet
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</Grid>

				{/* Right column: Quick Actions + Low Stock */}
				<Grid item xs={12} md={4}>
					<QuickActionsPanel onNavigate={onNavigate || (() => {})} />

					<Box sx={{ mt: 2 }}>
						<SectionHeader
							title="Low Stock"
							icon={<WarningAmberIcon sx={{ color: "#e65100" }} />}
							onViewAll={
								onNavigate ? () => onNavigate("production") : undefined
							}
						/>
						{lowStock.length > 0 ? (
							lowStock
								.slice(0, 5)
								.map((p, i) => (
									<LowStockCard key={`${p.name}-${i}`} product={p} />
								))
						) : (
							<Paper
								sx={{ p: 2.5, borderRadius: 2, textAlign: "center" }}
							>
								<Typography
									sx={{
										fontFamily,
										color: "#999",
										fontSize: "0.9rem",
									}}
								>
									All stock levels are healthy
								</Typography>
							</Paper>
						)}
					</Box>
				</Grid>
			</Grid>
		</Box>
  );
}
