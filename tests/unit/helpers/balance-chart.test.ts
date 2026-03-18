/**
 * 残高推移グラフヘルパー関数のテスト
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBalanceChartData,
  getPaymentMethodsForChart,
} from '@/lib/helpers/balance-chart';
import type { Transaction, PaymentMethodValue } from '@/types/transaction';
import type { BalanceAdjustment } from '@/types/balance-adjustment';
import { PaymentMethod } from '@/types/transaction';

describe('balance-chart helpers', () => {
  const mockDate = new Date('2024-01-15');

  const createMockTransaction = (
    date: Date,
    amount: number,
    paymentMethod: string,
    isIncome: boolean,
    advance?: { personalAmount: number; advanceAmount: number }
  ): Transaction => ({
    id: `tx-${Date.now()}-${Math.random()}`,
    userId: 'test-user',
    date,
    amount,
    category: { main: 'テスト', sub: 'テスト' },
    description: 'テスト取引',
    paymentMethod: paymentMethod as PaymentMethodValue,
    isIncome,
    advance: advance ? {
      type: 'friend',
      totalAmount: amount,
      personalAmount: advance.personalAmount,
      advanceAmount: advance.advanceAmount,
      status: 'pending' as const,
      isRecovered: false,
    } : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('getPaymentMethodsForChart', () => {
    it('すべての決済手段を返すこと', () => {
      const methods = getPaymentMethodsForChart();
      
      expect(methods.length).toBeGreaterThan(0);
      expect(methods[0]).toHaveProperty('key');
      expect(methods[0]).toHaveProperty('label');
      expect(methods[0]).toHaveProperty('color');
    });
  });

  describe('calculateBalanceChartData', () => {
    it('月次データが正しく計算されること', () => {
      const transactions: Transaction[] = [
        createMockTransaction(new Date('2024-01-10'), 10000, PaymentMethod.CASH, true),
        createMockTransaction(new Date('2024-01-12'), 5000, PaymentMethod.CASH, false),
      ];

      const chartData = calculateBalanceChartData(transactions, [], 'month');

      // 直近30日分のデータが生成されること
      expect(chartData.length).toBeGreaterThan(0);
      
      // 各データポイントに必要なプロパティがあること
      chartData.forEach((point) => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('dateKey');
        expect(point).toHaveProperty('totalAssets');
        expect(point).toHaveProperty(`${PaymentMethod.CASH}_positive`);
        expect(point).toHaveProperty(`${PaymentMethod.CASH}_negative`);
      });
    });

    it('年次データが正しく計算されること', () => {
      const transactions: Transaction[] = [
        createMockTransaction(new Date('2024-01-10'), 10000, PaymentMethod.OLIVE, true),
        createMockTransaction(new Date('2024-02-15'), 5000, PaymentMethod.OLIVE, false),
      ];

      const chartData = calculateBalanceChartData(transactions, [], 'year');

      // 直近12ヶ月分のデータが生成されること
      expect(chartData.length).toBe(12);
      
      // 各データポイントに必要なプロパティがあること
      chartData.forEach((point) => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('dateKey');
        expect(point).toHaveProperty('totalAssets');
      });
    });

    it('立替金を除外して計算すること', () => {
      const transactions: Transaction[] = [
        // 立替あり支出: 自己負担3000円、立替7000円
        createMockTransaction(
          new Date('2024-01-10'),
          10000,
          PaymentMethod.CASH,
          false,
          { personalAmount: 3000, advanceAmount: 7000 }
        ),
      ];

      const chartData = calculateBalanceChartData(transactions, [], 'month');

      // 最新の残高を確認
      const latestData = chartData[chartData.length - 1];
      // 立替支出はキャッシュアウト全額（10000円）として計上されること
      // マイナスなので _negative プロパティに値が入る
      expect(latestData[`${PaymentMethod.CASH}_negative`]).toBe(-10000);
      expect(latestData[`${PaymentMethod.CASH}_positive`]).toBe(0);
      expect(latestData.totalAssets).toBe(-10000);
    });

    it('残高調整を考慮して計算すること', () => {
      const adjustmentDate = new Date('2024-01-05');
      const transactions: Transaction[] = [
        createMockTransaction(new Date('2024-01-01'), 5000, PaymentMethod.CASH, false),
        createMockTransaction(new Date('2024-01-10'), 10000, PaymentMethod.CASH, true),
      ];

      const adjustments: BalanceAdjustment[] = [
        {
          id: 'adj-1',
          userId: 'test-user',
          date: adjustmentDate,
          paymentMethod: PaymentMethod.CASH,
          expectedBalance: -5000,
          actualBalance: 0, // 実際の残高は0円だった
          difference: 5000,
          memo: 'テスト調整',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chartData = calculateBalanceChartData(transactions, adjustments, 'month');

      // 最新の残高は調整後の0円 + その後の収入10000円 = 10000円
      const latestData = chartData[chartData.length - 1];
      // プラスなので _positive プロパティに値が入る
      expect(latestData[`${PaymentMethod.CASH}_positive`]).toBe(10000);
      expect(latestData[`${PaymentMethod.CASH}_negative`]).toBe(0);
    });

    it('振替取引を正しく処理すること', () => {
      const transactions: Transaction[] = [
        createMockTransaction(new Date('2024-01-10'), 10000, PaymentMethod.CASH, true),
        {
          id: 'tx-transfer',
          userId: 'test-user',
          date: new Date('2024-01-15'),
          amount: 5000,
          category: { main: '振替', sub: '口座間振替' },
          description: '振替',
          paymentMethod: PaymentMethod.CASH,
          isIncome: false,
          transactionType: 'transfer',
          transfer: {
            from: PaymentMethod.CASH,
            to: PaymentMethod.OLIVE,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const chartData = calculateBalanceChartData(transactions, [], 'month');
      const latestData = chartData[chartData.length - 1];

      // 現金: +10000 - 5000(振替出) = 5000 (プラス)
      expect(latestData[`${PaymentMethod.CASH}_positive`]).toBe(5000);
      expect(latestData[`${PaymentMethod.CASH}_negative`]).toBe(0);
      // OLIVE: +5000(振替入) = 5000 (プラス)
      expect(latestData[`${PaymentMethod.OLIVE}_positive`]).toBe(5000);
      expect(latestData[`${PaymentMethod.OLIVE}_negative`]).toBe(0);
      // 総資産: 10000（振替は総資産に影響しない）
      expect(latestData.totalAssets).toBe(10000);
    });

    it('複数の決済手段を正しく処理すること', () => {
      const transactions: Transaction[] = [
        createMockTransaction(new Date('2024-01-10'), 10000, PaymentMethod.CASH, true),
        createMockTransaction(new Date('2024-01-12'), 5000, PaymentMethod.OLIVE, true),
        createMockTransaction(new Date('2024-01-15'), 3000, PaymentMethod.CASH, false),
      ];

      const chartData = calculateBalanceChartData(transactions, [], 'month');
      const latestData = chartData[chartData.length - 1];

      // 現金: +10000 - 3000 = 7000 (プラス)
      expect(latestData[`${PaymentMethod.CASH}_positive`]).toBe(7000);
      expect(latestData[`${PaymentMethod.CASH}_negative`]).toBe(0);
      // OLIVE: +5000 = 5000 (プラス)
      expect(latestData[`${PaymentMethod.OLIVE}_positive`]).toBe(5000);
      expect(latestData[`${PaymentMethod.OLIVE}_negative`]).toBe(0);
      // 総資産: 12000
      expect(latestData.totalAssets).toBe(12000);
    });
  });
});

