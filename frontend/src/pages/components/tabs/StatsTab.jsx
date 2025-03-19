import React from "react";
import { useEffect, useState } from "react";
import pb from "../../../lib/pocketbase";
import StatCard from "../StatCard";
import { Skeleton } from "@mantine/core";
import { IconUsers, IconBook, IconLibrary, IconX } from "@tabler/icons-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";

function StatsTab() {
  const [loadingLibraryStats, setLoadingLibraryStats] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState([]);
  const [libraryStats, setLibraryStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalBorrows: 0,
    totalNotReturned: 0,
  });


  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const statsResponse = await pb.collection("stats").getList(1, 30);
        const formattedStats = statsResponse.items.map((item) => ({
          date: item.den,
          loans: item.pocet_pujcek_den,
        }));
        setStats(formattedStats);
        setLoadingStats(false);
      } catch (error) {
        console.error("Failed to fetch stats", error);
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchLibraryStats = async () => {
      try {
        setLoadingLibraryStats(true);

        const books = await pb.collection("stats_books").getOne("1");
        const users = await pb.collection("stats_users").getOne("1");
        const borrows = await pb.collection("stats_borrows").getOne("1");

        setLibraryStats({
          totalBooks: books.total_books,
          totalUsers: users.total_users,
          totalBorrows: borrows.total_borrows,
          totalNotReturned: borrows.total_not_returned,
        });
        setLoadingLibraryStats(false);
      } catch (error) {
        console.error("Failed to fetch library stats", error);
        setNotification({
          message: "Nepodařilo se načíst statistiky knihovny",
          color: "red",
        });
        setLoadingLibraryStats(false);
      }
    };

    fetchLibraryStats();
  }, []);

  const renderStatsChart = () => {
    const formatDateForChart = (dateString) => {
      const date = new Date(dateString);
      return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    };

    const formattedStats = stats.map((item) => ({
      ...item,
      date: formatDateForChart(item.date),
    }));

    return loadingStats ? (
      <Skeleton height={300} />
    ) : (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedStats}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value} půjčky`, "Počet půjček"]} />
          <Line
            type="monotone"
            dataKey="loans"
            name="Půjčky"
            stroke="var(--secondary)"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="stats">
      <h2>Statistiky</h2>
      {loadingLibraryStats ? (
        <Skeleton height={200} />
      ) : (
        <div>
          <div className="library-stats">
            <StatCard
              title="Počet uživatelů"
              value={libraryStats.totalUsers}
              icon={<IconUsers />}
            />
            <StatCard
              title="Počet knih"
              value={libraryStats.totalBooks}
              icon={<IconBook />}
            />
            <StatCard
              title="Počet půjček"
              value={libraryStats.totalBorrows}
              icon={<IconLibrary />}
            />
            <StatCard
              title="Počet nevrácených půjček"
              value={libraryStats.totalNotReturned}
              icon={<IconX />}
            />
          </div>
        </div>
      )}
      <div>
        <h3>Půjčky/den</h3>
        <div>{renderStatsChart()}</div>
      </div>
    </div>
  );
}

export default StatsTab;
