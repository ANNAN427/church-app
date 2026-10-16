/**
 * 恩典之言页面 - 随机抽取模式
 * 路径：pages/grace-cards/index.js
 */

Page({
  data: {
    config: {
      navTitle: '恩典之言',
      title: '每日恩典，心诚则见',
      subtitle1: '祈祷静候，恩典自天倾',
      subtitle2: '今日灵粮已备好，静待寻求者',
      sectionTitle: '恭候多时，请取走今日主恩',
      claimBtnText: '领取今日恩典',
      claimedText: '已领取'
    },
    todayCard: {
      cardId: null,
      cardDate: null,
      cardUrl: null,
      hasClaimed: false,
      claimTime: null,
      isWaiting: true
    },
    stats: {
      todayRemaining: 1,
      collectedCount: 0,
      totalCards: 368,
    },
    loading: false
  },

  // 恩典之言图片库（368 张）- 使用 3 位数字格式
  graceCards: [
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-001.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-002.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-003.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-004.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-005.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-006.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-007.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-008.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-009.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-010.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-011.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-012.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-013.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-014.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-015.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-016.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-017.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-018.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-019.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-020.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-021.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-022.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-023.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-024.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-025.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-026.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-027.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-028.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-029.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-030.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-031.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-032.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-033.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-034.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-035.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-036.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-037.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-038.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-039.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-040.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-041.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-042.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-043.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-044.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-045.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-046.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-047.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-048.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-049.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-050.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-051.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-052.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-053.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-054.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-055.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-056.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-057.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-058.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-059.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-060.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-061.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-062.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-063.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-064.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-065.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-066.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-067.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-068.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-069.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-070.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-071.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-072.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-073.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-074.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-075.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-076.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-077.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-078.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-079.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-080.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-081.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-082.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-083.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-084.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-085.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-086.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-087.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-088.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-089.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-090.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-091.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-092.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-093.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-094.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-095.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-096.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-097.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-098.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-099.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-100.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-101.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-102.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-103.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-104.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-105.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-106.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-107.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-108.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-109.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-110.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-111.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-112.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-113.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-114.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-115.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-116.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-117.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-118.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-119.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-120.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-121.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-122.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-123.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-124.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-125.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-126.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-127.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-128.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-129.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-130.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-131.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-132.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-133.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-134.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-135.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-136.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-137.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-138.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-139.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-140.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-141.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-142.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-143.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-144.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-145.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-146.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-147.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-148.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-149.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-150.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-151.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-152.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-153.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-154.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-155.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-156.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-157.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-158.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-159.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-160.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-161.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-162.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-163.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-164.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-165.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-166.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-167.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-168.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-169.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-170.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-171.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-172.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-173.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-174.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-175.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-176.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-177.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-178.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-179.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-180.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-181.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-182.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-183.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-184.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-185.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-186.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-187.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-188.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-189.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-190.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-191.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-192.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-193.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-194.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-195.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-196.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-197.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-198.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-199.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-200.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-201.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-202.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-203.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-204.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-205.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-206.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-207.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-208.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-209.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-210.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-211.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-212.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-213.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-214.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-215.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-216.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-217.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-218.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-219.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-220.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-221.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-222.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-223.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-224.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-225.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-226.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-227.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-228.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-229.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-230.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-231.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-232.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-233.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-234.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-235.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-236.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-237.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-238.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-239.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-240.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-241.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-242.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-243.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-244.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-245.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-246.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-247.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-248.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-249.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-250.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-251.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-252.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-253.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-254.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-255.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-256.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-257.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-258.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-259.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-260.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-261.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-262.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-263.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-264.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-265.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-266.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-267.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-268.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-269.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-270.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-271.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-272.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-273.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-274.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-275.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-276.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-277.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-278.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-279.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-280.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-281.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-282.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-283.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-284.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-285.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-286.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-287.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-288.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-289.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-290.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-291.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-292.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-293.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-294.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-295.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-296.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-297.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-298.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-299.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-300.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-301.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-302.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-303.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-304.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-305.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-306.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-307.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-308.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-309.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-310.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-311.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-312.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-313.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-314.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-315.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-316.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-317.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-318.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-319.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-320.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-321.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-322.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-323.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-324.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-325.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-326.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-327.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-328.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-329.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-330.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-331.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-332.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-333.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-334.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-335.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-336.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-337.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-338.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-339.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-340.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-341.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-342.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-343.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-344.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-345.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-346.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-347.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-348.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-349.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-350.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-351.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-352.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-353.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-354.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-355.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-356.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-357.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-358.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-359.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-360.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-361.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-362.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-363.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-364.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-365.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-366.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-367.jpg',
    'https://1689.1r1zhux.com/beads/jd-cards/jd-card-368.jpg'
  ],

  onLoad: function(options) {
    // 启用分享菜单
    try {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    } catch(e) {}
    
    options = options || {};
    if (options.sharedCardUrl) {
      var sharedCardUrl = decodeURIComponent(options.sharedCardUrl);
      var sharedCardName = options.sharedCardName ? decodeURIComponent(options.sharedCardName) : '好友分享的恩典';
      var sharedCardId = options.sharedCardId ? decodeURIComponent(options.sharedCardId) : '';
      wx.redirectTo({
        url: '/pages/blessing/detail?cardUrl=' + encodeURIComponent(sharedCardUrl) + '&cardId=' + encodeURIComponent(sharedCardId) + '&cardName=' + encodeURIComponent(sharedCardName)
      });
      return;
    }
    
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  // 加载数据 - 完全随机模式
  loadData: function() {
    var todayStr = new Date().toISOString().split('T')[0];
    var storageKey = 'grace_claimed_' + todayStr;
    var collectedKey = 'grace_collected_count';
    
    var hasClaimed = wx.getStorageSync(storageKey) || false;
    // 读取实际收藏列表数量，而不是计数器
    var collectedCards = wx.getStorageSync('collectedCards') || [];
    var collectedCount = collectedCards.length;
    
    var todayCard = {
      cardId: null,
      cardDate: todayStr,
      cardUrl: null,
      hasClaimed: hasClaimed,
      claimTime: hasClaimed ? wx.getStorageSync(storageKey + '_time') : null,
      isWaiting: !hasClaimed
    };
    
    if (hasClaimed) {
      var claimedCardUrl = wx.getStorageSync(storageKey + '_card');
      var claimedCardId = wx.getStorageSync(storageKey + '_cardId');
      todayCard.cardUrl = claimedCardUrl;
      todayCard.cardId = claimedCardId;
      todayCard.isWaiting = false;
    }
    
    this.setData({
      todayCard: todayCard,
      'stats.collectedCount': collectedCount,
      loading: false
    });
  },

  // 领取恩典 - 完全随机
  onClaimCard: function() {
    var that = this;
    if (this.data.todayCard.hasClaimed) {
      return;
    }
    
    this.setData({ loading: true });
    
    var todayStr = new Date().toISOString().split('T')[0];
    var storageKey = 'grace_claimed_' + todayStr;
    var collectedKey = 'grace_collected_count';
    
    // 完全随机选择一张图片
    var randomIndex = Math.floor(Math.random() * this.graceCards.length);
    var selectedCardUrl = this.graceCards[randomIndex];
    var cardId = 'grace_' + todayStr + '_' + randomIndex;
    var collectedCount = (wx.getStorageSync(collectedKey) || 0) + 1;
    
    // 保存领取记录
    wx.setStorageSync(storageKey, true);
    wx.setStorageSync(storageKey + '_time', new Date().toLocaleString('zh-CN'));
    wx.setStorageSync(storageKey + '_card', selectedCardUrl);
    wx.setStorageSync(storageKey + '_cardId', cardId);
    wx.setStorageSync(collectedKey, collectedCount);
    
    // 同步保存到收藏列表
    var collectedCards = wx.getStorageSync('collectedCards') || [];
    var cardExists = false;
    for (var i = 0; i < collectedCards.length; i++) {
      if (collectedCards[i].card_id === cardId) {
        cardExists = true;
        break;
      }
    }
    if (!cardExists) {
      collectedCards.push({
        card_id: cardId,
        card_url: selectedCardUrl,
        blessing_text: '恩典之言',
        collect_date: new Date().toLocaleString('zh-CN')
      });
      wx.setStorageSync('collectedCards', collectedCards);
    }
    
    wx.showToast({
      title: '领取成功',
      icon: 'success',
      duration: 2000
    });
    
    this.setData({
      'todayCard.hasClaimed': true,
      'todayCard.cardUrl': selectedCardUrl,
      'todayCard.cardId': cardId,
      'todayCard.claimTime': new Date().toLocaleString('zh-CN'),
      'todayCard.isWaiting': false,
      'stats.collectedCount': collectedCount,
      loading: false
    });
    
    // 延迟跳转到详情页
    setTimeout(function() {
      wx.navigateTo({
        url: '/pages/blessing/detail?cardId=' + cardId + '&cardUrl=' + encodeURIComponent(selectedCardUrl)
      });
    }, 800);
  },

  onViewCollected: function() {
    wx.navigateTo({
      url: '/pages/blessing/collected'
    });
  },

  // 分享给好友
  onShareAppMessage: function() {
    var that = this;
    if (this.data.todayCard.hasClaimed && this.data.todayCard.cardUrl) {
      return {
        title: '我领取了今日恩典之言，你也来领取吧！',
        path: '/pages/grace-cards/index?sharedCardUrl=' + encodeURIComponent(this.data.todayCard.cardUrl) + '&sharedCardId=' + encodeURIComponent(this.data.todayCard.cardId) + '&sharedCardName=' + encodeURIComponent('今日恩典')
      };
    }
    return {
      title: '恩典之言 - 每日领取属灵灵粮',
      path: '/pages/grace-cards/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    if (this.data.todayCard.hasClaimed && this.data.todayCard.cardUrl) {
      return {
        title: '我领取了今日恩典之言',
        query: 'sharedCardUrl=' + encodeURIComponent(this.data.todayCard.cardUrl) + '&sharedCardId=' + encodeURIComponent(this.data.todayCard.cardId) + '&sharedCardName=' + encodeURIComponent('今日恩典'),
        imageUrl: this.data.todayCard.cardUrl
      };
    }
    return {
      title: '恩典之言 - 每日领取属灵灵粮',
      imageUrl: 'https://1689.1r1zhux.com/beads/jd-cards/jd-card-001.jpg'
    };
  }
});
