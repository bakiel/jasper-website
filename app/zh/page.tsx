'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Globe, Building2, Zap, BarChart3, Shield, MessageCircle, ChevronRight, Factory, Cpu, Droplets, Sun } from 'lucide-react';
import { Button } from '../../components/Button';

interface ChinesePageProps {
    onNavigate?: (path: string) => void;
}

const ChinesePage: React.FC<ChinesePageProps> = ({ onNavigate }) => {
    const whatsappUrl = `https://wa.me/27659387000?text=${encodeURIComponent('您好，我对JASPER金融建模服务感兴趣。我想了解更多关于您在中国市场的服务。')}`;

    const sectors = [
        { icon: Sun, name: '可再生能源', nameEn: 'Renewable Energy', desc: '太阳能、风能、储能项目' },
        { icon: Building2, name: '基础设施', nameEn: 'Infrastructure', desc: '交通、港口、物流' },
        { icon: Cpu, name: '数据中心', nameEn: 'Data Centres', desc: '超大规模、边缘计算设施' },
        { icon: Factory, name: '农业综合企业', nameEn: 'Agribusiness', desc: '加工、价值链、冷链' },
        { icon: Droplets, name: '水务与卫生', nameEn: 'Water & Sanitation', desc: '处理、分配、废水' },
    ];

    const dfis = [
        'IFC', 'AfDB', 'AIIB', 'NDB', 'ADB', 'Silk Road Fund', 'CDB', 'EXIM Bank China'
    ];

    const stats = [
        { val: '$50亿+', label: '已建模项目' },
        { val: '35', label: '标准表格' },
        { val: '12个', label: 'DFI格式' },
        { val: '<72小时', label: '首稿交付' },
    ];

    const packages = [
        {
            name: '核心方案',
            nameEn: 'Core Package',
            price: '¥98,000',
            usd: '($13,500)',
            desc: '基础财务模型，适合早期项目评估',
            features: ['35表财务模型', '5年预测期', 'IRR/NPV分析', '单一DFI格式']
        },
        {
            name: '专业方案',
            nameEn: 'Professional',
            price: '¥178,000',
            usd: '($24,500)',
            desc: '全面分析，适合DFI申请',
            features: ['完整JASPER™架构', '10年预测期', '敏感性分析', '多DFI格式', '技术尽职调查支持'],
            popular: true
        },
        {
            name: '企业方案',
            nameEn: 'Enterprise',
            price: '定制报价',
            usd: '',
            desc: '复杂项目的端到端支持',
            features: ['定制模型设计', '无限修订', '董事会演示文稿', '专属顾问团队', 'DFI沟通支持']
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen w-full bg-[#050A14] overflow-hidden"
        >
            {/* Navigation */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 bg-[#050A14]/90 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate?.('/')}
                        className="p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="h-6 w-px bg-white/10 hidden md:block" />
                    <span className="text-sm font-bold text-white uppercase tracking-widest hidden md:block">
                        JASPER 金融建模
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate?.('/')}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                        English
                    </button>
                    <span className="text-xs text-brand-emerald font-semibold">中文</span>
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs rounded-full bg-brand-emerald hover:bg-brand-emerald/90 text-white font-semibold shadow-lg shadow-brand-emerald/20 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        微信咨询
                    </a>
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden border-b border-white/5">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-emerald/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                </div>

                <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold tracking-widest text-red-400 uppercase backdrop-blur-md">
                            <Globe className="w-3.5 h-3.5" /> 中国市场专属服务
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-tight">
                            投资级财务模型
                            <br />
                            <span className="text-brand-emerald">符合国际DFI标准</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                            为中国投资者和开发商量身定制的专业财务建模服务。
                            <br className="hidden md:block" />
                            满足IFC、AfDB、AIIB等国际开发金融机构的严格要求。
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-10 py-4 text-lg rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold shadow-xl transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                                立即咨询
                            </a>
                            <Button
                                variant="secondary"
                                className="!px-10 !py-4 !text-lg !rounded-full !bg-white/5 !border-white/20"
                                onClick={() => onNavigate?.('/contact')}
                            >
                                项目评估表 <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-6 lg:px-12 bg-[#0B1221] border-b border-white/5">
                <div className="container mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-6 rounded-xl bg-[#050A14]/80 border border-white/10 text-center backdrop-blur-sm group hover:border-brand-emerald/50 transition-colors"
                            >
                                <div className="text-2xl md:text-3xl font-bold text-white mb-2 font-mono group-hover:text-brand-emerald transition-colors">
                                    {stat.val}
                                </div>
                                <div className="text-xs text-gray-500 uppercase tracking-widest">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why JASPER Section */}
            <section className="py-24 px-6 lg:px-12 bg-[#050A14]">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <div className="inline-block px-3 py-1 mb-4 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[10px] font-bold tracking-widest text-brand-emerald uppercase">
                            核心优势
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                            为什么选择JASPER™
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            我们不只是构建电子表格。我们构建通过技术尽职调查的投资工具。
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-brand-emerald/30 transition-colors"
                        >
                            <div className="p-3 rounded-lg bg-brand-emerald/10 text-brand-emerald w-fit mb-6">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">35表标准架构</h3>
                            <p className="text-gray-400">
                                经过验证的模型结构，涵盖从假设到敏感性分析的完整财务分析框架。
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-brand-emerald/30 transition-colors"
                        >
                            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 w-fit mb-6">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">多DFI格式兼容</h3>
                            <p className="text-gray-400">
                                一个模型，多种输出格式。符合IFC、AfDB、AIIB、ADB等机构的特定要求。
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-brand-emerald/30 transition-colors"
                        >
                            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 w-fit mb-6">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">工程级精度</h3>
                            <p className="text-gray-400">
                                物理模型驱动的财务预测。真实的性能曲线，而非理想化假设。
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Sectors Section */}
            <section className="py-24 px-6 lg:px-12 bg-[#0B1221] border-t border-white/5">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                            覆盖行业领域
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            深入理解每个行业的技术参数和财务驱动因素
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {sectors.map((sector, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-6 rounded-xl bg-[#050A14] border border-white/10 hover:border-brand-emerald/30 transition-colors text-center group cursor-pointer"
                                onClick={() => onNavigate?.(`/sectors/${sector.nameEn.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`)}
                            >
                                <div className="p-3 rounded-lg bg-brand-emerald/10 text-brand-emerald w-fit mx-auto mb-4 group-hover:bg-brand-emerald group-hover:text-white transition-colors">
                                    <sector.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">{sector.name}</h3>
                                <p className="text-xs text-gray-500">{sector.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DFI Partners Section */}
            <section className="py-20 px-6 lg:px-12 bg-[#050A14]">
                <div className="container mx-auto text-center">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-10">
                        支持的开发金融机构格式
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {dfis.map((dfi, i) => (
                            <span
                                key={i}
                                className="px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.02] text-gray-400 text-sm font-medium hover:bg-white/10 hover:text-white transition-colors cursor-default"
                            >
                                {dfi}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-32 px-6 lg:px-12 bg-[#0B1221] border-t border-white/5">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-16">
                        <div className="inline-block px-3 py-1 mb-4 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-[10px] font-bold tracking-widest text-brand-emerald uppercase">
                            服务套餐
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                            透明定价
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            所有价格包含多DFI格式输出。USDT支付享5%折扣。
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {packages.map((pkg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className={`p-8 rounded-2xl relative ${
                                    pkg.popular
                                        ? 'bg-white/[0.04] border-2 border-brand-emerald/50'
                                        : 'bg-white/[0.02] border border-white/10 hover:border-brand-emerald/30'
                                } transition-colors`}
                            >
                                {pkg.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-brand-emerald text-white text-xs font-semibold px-4 py-1 rounded-full">
                                            最受欢迎
                                        </span>
                                    </div>
                                )}
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
                                    <p className="text-xs text-gray-500 mb-4">{pkg.nameEn}</p>
                                    <div className="text-3xl font-bold text-brand-emerald">{pkg.price}</div>
                                    {pkg.usd && <p className="text-xs text-gray-500">{pkg.usd}</p>}
                                    <p className="text-sm text-gray-400 mt-3">{pkg.desc}</p>
                                </div>
                                <ul className="space-y-3">
                                    {pkg.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                            <Check className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-24 px-6 lg:px-12 bg-[#050A14] border-t border-white/5">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                            服务流程
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {[
                            { step: '01', title: '初步咨询', desc: '免费30分钟电话或视频会议，了解您的项目需求' },
                            { step: '02', title: '项目评估', desc: '提交项目详情，我们在24小时内提供定制报价' },
                            { step: '03', title: '模型开发', desc: '签约后72小时内交付首稿，包含完整假设文档' },
                            { step: '04', title: '迭代优化', desc: '根据反馈进行调整，确保满足所有DFI要求' },
                            { step: '05', title: '交付支持', desc: '提供模型培训和DFI提交过程中的技术支持' },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-6 p-6 rounded-xl bg-white/[0.02] border border-white/10 hover:border-brand-emerald/30 transition-colors"
                            >
                                <div className="text-3xl font-bold text-brand-emerald/30 font-mono">{item.step}</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-gray-400">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 lg:px-12 bg-[#0F172A] text-center border-t border-white/5">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        准备好开始您的项目了吗？
                    </h2>
                    <p className="text-gray-400 mb-8 text-lg">
                        通过微信或WhatsApp联系我们，获得即时响应。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-10 py-4 text-lg rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold shadow-xl transition-colors"
                        >
                            <MessageCircle className="w-5 h-5" />
                            WhatsApp 咨询
                        </a>
                        <Button
                            className="!px-10 !py-4 !text-lg !rounded-full shadow-xl shadow-brand-emerald/20"
                            onClick={() => onNavigate?.('/contact')}
                        >
                            提交项目评估表 <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 lg:px-12 bg-[#050A14] border-t border-white/10">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-xl font-bold text-white mb-1">JASPER™</p>
                            <p className="text-sm text-gray-500">金融架构系统</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => onNavigate?.('/')}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                English Version
                            </button>
                            <span className="text-gray-600">|</span>
                            <a
                                href="mailto:info@jasperfinance.org"
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                info@jasperfinance.org
                            </a>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-xs text-gray-600">
                            © 2025 JASPER Financial Architecture. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </motion.div>
    );
};

export default ChinesePage;
