import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export async function GET(_request: NextRequest) {
  try {
    const bountiesCount = await prisma.bounties.count({
      where: { isPublished: true },
    });

    // Value currently "up for grabs": published, still OPEN, winners not yet
    // announced. (Distinct from totalInUSD below, which is value already
    // awarded.)
    const openWhere = {
      isPublished: true,
      status: 'OPEN' as const,
      isWinnersAnnounced: false,
    };
    // usdValue is only backfilled when winners are announced, so for live
    // listings we fall back to the raw reward amount / ask so the total
    // reflects real prize pools instead of summing a column full of nulls.
    const openListings = await prisma.bounties.findMany({
      where: openWhere,
      select: {
        usdValue: true,
        rewardAmount: true,
        maxRewardAsk: true,
        minRewardAsk: true,
      },
    });
    const openCount = openListings.length;
    const openValue = openListings.reduce((sum, l) => {
      const value =
        l.usdValue ??
        l.rewardAmount ??
        l.maxRewardAsk ??
        l.minRewardAsk ??
        0;
      return sum + value;
    }, 0);
    const openInUSD = Math.ceil(openValue / 10) * 10;

    const totalRewardAmountResult = await prisma.bounties.aggregate({
      _sum: { usdValue: true },
      where: {
        isWinnersAnnounced: true,
        isPublished: true,
        status: 'OPEN',
      },
    });

    const totalApprovedGrantAmountResult =
      await prisma.grantApplication.aggregate({
        _sum: { approvedAmountInUSD: true },
        where: {
          OR: [
            { applicationStatus: 'Approved' },
            { applicationStatus: 'Completed' },
          ],
        },
      });

    const totalListingRewardAmount = totalRewardAmountResult._sum.usdValue || 0;
    const totalApprovedGrantAmount =
      totalApprovedGrantAmountResult._sum.approvedAmountInUSD || 0;

    const roundedTotalRewardAmount =
      Math.ceil((totalListingRewardAmount + totalApprovedGrantAmount) / 10) *
      10;

    logger.info('Successfully fetched counts and totals', {
      totalInUSD: roundedTotalRewardAmount,
      count: bountiesCount,
    });

    return NextResponse.json(
      {
        totalInUSD: roundedTotalRewardAmount,
        count: bountiesCount,
        openInUSD,
        openCount,
      },
      {
        headers: {
          'Cache-Control':
            'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
        },
      },
    );
  } catch (error: any) {
    logger.error('Error occurred while fetching totals and counts', {
      error: error.message,
    });

    return NextResponse.json(
      { error: 'An error occurred while fetching the total reward amount' },
      { status: 500 },
    );
  }
}
