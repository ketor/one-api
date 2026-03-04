import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BlurText, FadeIn, StaggerIn, PixelCard, PixelBlast, SvgParticleMorph } from '../../components/animations';

/* ── Tool brand logos (official Simple Icons SVG paths) ── */
const CursorLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-xyz-gray-10">
    <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/>
  </svg>
);

const ClaudeCodeLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#D97757">
    <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>
  </svg>
);

const VSCodeClineLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#007ACC">
    <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
  </svg>
);

const OpenCodeLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#211E1E"/>
    <rect x="6" y="6" width="12" height="12" fill="#CFCECD"/>
  </svg>
);

const toolLogos = {
  'Cursor': <CursorLogo />,
  'Claude Code': <ClaudeCodeLogo />,
  'VSCode + Cline': <VSCodeClineLogo />,
  'OpenCode': <OpenCodeLogo />,
};

/* ── Typewriter terminal animation (XYZ style) ── */
const typewriterLines = [
  '$ export OPENAI_API_BASE=https://api.alayanew.com/v1',
  '$ export OPENAI_API_KEY=sk-xxxxxxxx',
  '$ curl $OPENAI_API_BASE/chat/completions \\',
  '    -H "Authorization: Bearer $OPENAI_API_KEY" \\',
  '    -d \'{"model":"kimi-2.5","messages":[{"role":"user","content":"Hello"}]}\'',
  '',
  '{"choices":[{"message":{"content":"Hello! How can I help you?"}}]}',
];

const TerminalAnimation = () => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines < typewriterLines.length) {
      const timer = setTimeout(
        () => setVisibleLines((v) => v + 1),
        visibleLines === 0 ? 500 : 400
      );
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  return (
    <div className='border border-xyz-white-2 bg-[#0d1220] overflow-hidden'>
      <div className='flex gap-2.5 p-4'>
        <div className='w-3 h-3 rounded-full bg-xyz-blue-6' />
        <div className='w-3 h-3 rounded-full border border-xyz-white-4' />
        <div className='w-3 h-3 rounded-full border border-xyz-white-4' />
      </div>
      <div className='px-5 pb-5 font-code text-xs leading-[1.8] text-xyz-white-6'>
        {typewriterLines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={line === '' ? 'h-4' : ''}>
            {line.startsWith('$') ? (
              <>
                <span className='text-xyz-blue-6'>$ </span>
                <span className='text-white'>{line.slice(2)}</span>
              </>
            ) : line.startsWith('{') ? (
              <span className='text-xyz-blue-5'>{line}</span>
            ) : (
              <span className='text-xyz-white-6'>{line}</span>
            )}
          </div>
        ))}
        {visibleLines < typewriterLines.length && (
          <span className='inline-block h-4 w-2 animate-pulse bg-xyz-white-5' />
        )}
      </div>
    </div>
  );
};

/* ── SVG shapes for particle morph (Features section) ── */
const featureParticleShapes = [
  {
    // Lightning bolt (Lucide zap) — 国内直连
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z', fill: '#fff' },
    ],
  },
  {
    // OpenAI logo — OpenAI 兼容
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z', fill: '#fff' },
    ],
  },
  {
    // Shield check (Lucide) — 安全可靠
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', stroke: '#fff', strokeWidth: 1.5, fill: 'none' },
      { d: 'm9 12 2 2 4-4', stroke: '#fff', strokeWidth: 1.5, fill: 'none' },
    ],
  },
];

/* ── Landing Page ── */
const LandingPage = () => {
  const { t } = useTranslation();
  const [activeFeature, setActiveFeature] = useState(0);

  const models = [
    {
      name: 'Kimi 2.5',
      provider: 'Moonshot AI',
      context: '200K',
      highlight: t('marketing.models.kimi_highlight'),
      description: t('marketing.models.kimi_desc'),
      badge: t('marketing.models.badge_popular'),
    },
    {
      name: 'Qwen 3.5',
      provider: t('marketing.models.qwen_provider'),
      context: '128K',
      highlight: t('marketing.models.qwen_highlight'),
      description: t('marketing.models.qwen_desc'),
      badge: t('marketing.models.badge_recommended'),
    },
    {
      name: 'GLM 5',
      provider: t('marketing.models.glm_provider'),
      context: '128K',
      highlight: t('marketing.models.glm_highlight'),
      description: t('marketing.models.glm_desc'),
      badge: t('marketing.models.badge_new'),
    },
  ];

  const tools = [
    { name: 'Cursor', description: t('marketing.tools.cursor_desc'), config: 'Settings > Models > OpenAI API Base' },
    { name: 'Claude Code', description: t('marketing.tools.claude_code_desc'), config: 'ANTHROPIC_BASE_URL' },
    { name: 'VSCode + Cline', description: t('marketing.tools.cline_desc'), config: 'Extension Settings > API Base URL' },
    { name: 'OpenCode', description: t('marketing.tools.opencode_desc'), config: 'config.yaml > base_url' },
  ];

  return (
    <div className='flex flex-col'>

      {/* ══════ Hero Section (深紫蓝渐变) ══════ */}
      <section className='relative min-h-[680px] bg-xyz-gray-10 overflow-hidden flex flex-col items-center justify-center'>
        <div className='absolute inset-0 z-[1]'>
          <PixelBlast
            color='#4362ff'
            variant='square'
            pixelSize={4}
            patternScale={2}
            patternDensity={1.5}
            speed={0.3}
            enableRipples={false}
            edgeFade={0.35}
            transparent={true}
          />
        </div>
        <div className='relative z-10 text-center max-w-xyz px-5 py-32'>
          <h1 className='text-[64px] font-medium leading-[76px] text-white mb-4'>
            <BlurText
              text={t('marketing.hero.title_line1')}
              delay={80}
              animateBy='words'
              direction='bottom'
              className='justify-center'
            />
            <br />
            <BlurText
              text={t('marketing.hero.title_line2')}
              delay={80}
              animateBy='words'
              direction='bottom'
              className='justify-center text-white'
              stepDuration={0.4}
            />
          </h1>
          <FadeIn delay={0.4} distance={20}>
            <p className='text-base font-light leading-7 text-xyz-white-7 mb-1'>
              Alaya Code 聚合 Kimi、通义千问、智谱 GLM 等国产大模型，提供 OpenAI 兼容接口。
            </p>
            <p className='text-base font-light leading-7 text-xyz-white-7 mb-10'>
              无需切换 SDK，一行配置即可接入 Cursor、Claude Code 等 AI 工具链。
            </p>
          </FadeIn>
          <FadeIn delay={0.6} distance={20}>
            <div className='flex justify-center gap-4'>
              <Link
                to='/register'
                className='inline-flex items-center justify-center gap-2 bg-white text-xyz-blue-6 text-base font-light h-10 px-6 no-underline transition-colors hover:bg-xyz-gray-1'
              >
                {t('marketing.hero.cta_start')}
                <svg width='14' height='12' viewBox='0 0 14 12' fill='none' className='rotate-[-45deg]'>
                  <path d='M1 6H13M13 6L8 1M13 6L8 11' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                </svg>
              </Link>
              <Link
                to='/pricing'
                className='inline-flex items-center justify-center gap-2 border border-xyz-white-3 text-white text-base font-light h-10 px-6 no-underline transition-colors hover:border-xyz-white-5'
              >
                {t('marketing.hero.cta_pricing')}
              </Link>
            </div>
          </FadeIn>
          <FadeIn delay={0.8} distance={15}>
            <div className='flex justify-center gap-8 mt-8 text-sm font-light text-xyz-white-6'>
              <span className='flex items-center gap-2'>
                <span className='w-1.5 h-1.5 rounded-full bg-green-400' />
                {t('marketing.hero.free_trial')}
              </span>
              <span className='flex items-center gap-2'>
                <span className='w-1.5 h-1.5 rounded-full bg-green-400' />
                {t('marketing.hero.pay_as_you_go')}
              </span>
              <span className='flex items-center gap-2'>
                <span className='w-1.5 h-1.5 rounded-full bg-green-400' />
                {t('marketing.hero.no_vpn')}
              </span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════ Pricing Preview (白底 LIGHT) — 定价放上面 ══════ */}
      <section className='xyz-section-light'>
        <div className='max-w-xyz mx-auto'>
          <div className='xyz-section-light-inner px-5 py-20'>
            <FadeIn className='text-center mb-20'>
              <h2 className='text-5xl font-medium leading-[56px] text-xyz-gray-10 mb-4'>
                <BlurText
                  text={t('marketing.pricing_preview.title')}
                  delay={60}
                  animateBy='words'
                  direction='bottom'
                  className='justify-center'
                  animationFrom={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
                  animationTo={[
                    { filter: 'blur(5px)', opacity: 0.5, y: -5 },
                    { filter: 'blur(0px)', opacity: 1, y: 0 },
                  ]}
                />
              </h2>
              <FadeIn delay={0.2} distance={15}>
                <p className='text-lg font-light text-xyz-gray-6'>
                  {t('marketing.pricing_preview.subtitle')}
                </p>
              </FadeIn>
            </FadeIn>
            <StaggerIn
              staggerDelay={0.1}
              direction='up'
              distance={40}
              className='grid grid-cols-4 mx-auto'
              style={{ gap: '20px' }}
            >
              {[
                {
                  tier: 'GLOW',
                  price: '免费',
                  priceNote: '',
                  desc: '个人开发者入门',
                  features: ['5 个模型可用', '100 次/天调用', '社区支持'],
                  cta: '免费注册',
                  ctaStyle: 'border',
                  highlight: false,
                },
                {
                  tier: 'STAR',
                  price: '¥99',
                  priceNote: '/月',
                  desc: '独立开发者进阶',
                  features: ['20+ 模型可用', '5,000 次/天调用', '邮件支持'],
                  cta: '开始使用',
                  ctaStyle: 'border',
                  highlight: false,
                },
                {
                  tier: 'SOLAR',
                  price: '¥299',
                  priceNote: '/月',
                  desc: '团队协作首选',
                  features: ['全部模型可用', '50,000 次/天调用', '专属客服'],
                  cta: '立即升级',
                  ctaStyle: 'fill',
                  highlight: true,
                  badge: '推荐',
                },
                {
                  tier: 'GALAXY',
                  price: '联系我们',
                  priceNote: '',
                  desc: '企业级定制方案',
                  features: ['无限模型 & 调用', '私有化部署', 'SLA 保障'],
                  cta: '联系销售',
                  ctaStyle: 'border',
                  highlight: false,
                },
              ].map((plan) => (
                <div
                  key={plan.tier}
                  className={`p-6 transition-all duration-300 ${
                    plan.highlight
                      ? 'border border-xyz-blue-6 bg-[rgba(67,98,255,0.05)]'
                      : 'border border-xyz-gray-3 hover:border-xyz-gray-5 hover:bg-xyz-gray-1'
                  }`}
                >
                  {plan.badge && (
                    <span className='inline-block text-xs font-medium text-xyz-blue-6 border border-xyz-blue-6/30 px-2 py-0.5 mb-3'>
                      {plan.badge}
                    </span>
                  )}
                  <h3 className='mb-1'>
                    <span className='text-xs font-light text-xyz-gray-5 tracking-wider'>ALAYA CODE</span>
                    <br />
                    <span className='text-2xl font-medium text-xyz-gray-10'>{plan.tier}</span>
                  </h3>
                  <p className='text-sm font-light text-xyz-gray-6 mb-4'>{plan.desc}</p>
                  <div className='mb-6'>
                    <span className='text-3xl font-medium text-xyz-gray-10'>{plan.price}</span>
                    {plan.priceNote && (
                      <span className='text-sm font-light text-xyz-gray-6 ml-1'>{plan.priceNote}</span>
                    )}
                  </div>
                  <ul className='space-y-3 mb-8 list-none p-0'>
                    {plan.features.map((f, i) => (
                      <li key={i} className='flex items-center gap-2 text-sm font-light text-xyz-gray-7'>
                        <span className='w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0' />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to='/register'
                    className={`block w-full text-center text-sm font-light h-10 leading-10 no-underline transition-colors ${
                      plan.ctaStyle === 'fill'
                        ? 'bg-xyz-blue-6 text-white hover:bg-[#3451e6]'
                        : 'border border-xyz-gray-4 text-xyz-gray-10 hover:border-xyz-gray-7'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </StaggerIn>
            <FadeIn delay={0.3} className='mt-10 text-center'>
              <Link
                to='/pricing'
                className='inline-flex items-center gap-2 text-sm font-light text-xyz-blue-6 no-underline transition-colors hover:text-xyz-blue-8'
              >
                {t('marketing.pricing_preview.view_all')}
                <svg width='14' height='12' viewBox='0 0 14 12' fill='none'>
                  <path d='M1 6H13M13 6L8 1M13 6L8 11' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                </svg>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════ Models Section (深色 DARK) ══════ */}
      <section className='bg-xyz-gray-10'>
        <div className='max-w-xyz mx-auto'>
          <div className='xyz-section-inner px-5 py-20'>
            <FadeIn className='text-center mb-20'>
              <h2 className='text-5xl font-medium leading-[56px] text-white mb-4'>
                <BlurText
                  text={t('marketing.models.title')}
                  delay={60}
                  animateBy='words'
                  direction='bottom'
                  className='justify-center'
                />
              </h2>
              <FadeIn delay={0.2} distance={15}>
                <p className='text-lg font-light text-xyz-white-6'>
                  {t('marketing.models.subtitle')}
                </p>
              </FadeIn>
            </FadeIn>
            <StaggerIn
              staggerDelay={0.12}
              direction='up'
              distance={40}
              className='grid gap-0 md:grid-cols-3'
            >
              {models.map((model) => (
                <div
                  key={model.name}
                  className='border border-xyz-white-2 p-5 transition-all duration-300 hover:border-xyz-white-5 hover:bg-[rgba(255,255,255,0.03)]'
                >
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-xs font-medium text-xyz-blue-5 border border-xyz-blue-6/30 px-2 py-0.5'>
                      {model.badge}
                    </span>
                    <span className='text-xs font-light text-xyz-white-5'>
                      {model.provider}
                    </span>
                  </div>
                  <h3 className='text-xl font-medium text-white mb-2'>{model.name}</h3>
                  <p className='text-sm font-light text-xyz-white-6 mb-4'>
                    <span className='text-xyz-blue-5 font-medium'>{model.context}</span>{' '}
                    {t('marketing.models.context_label')} &middot; {model.highlight}
                  </p>
                  <p className='text-sm font-light text-xyz-white-5 leading-relaxed'>
                    {model.description}
                  </p>
                </div>
              ))}
            </StaggerIn>
            <FadeIn delay={0.3} className='mt-10 text-center'>
              <Link
                to='/docs'
                className='inline-flex items-center gap-2 text-sm font-light text-xyz-white-6 no-underline transition-colors hover:text-white'
              >
                {t('marketing.models.view_all')}
                <svg width='14' height='12' viewBox='0 0 14 12' fill='none'>
                  <path d='M1 6H13M13 6L8 1M13 6L8 11' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                </svg>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════ Tools Integration (白底 LIGHT) — 四个均分 + logo ══════ */}
      <section className='xyz-section-light'>
        <div className='max-w-xyz mx-auto'>
          <div className='xyz-section-light-inner px-5 py-20'>
            <FadeIn className='text-center mb-20'>
              <h2 className='text-5xl font-medium leading-[56px] text-xyz-gray-10 mb-4'>
                <BlurText
                  text={t('marketing.tools.title')}
                  delay={60}
                  animateBy='words'
                  direction='bottom'
                  className='justify-center'
                  animationFrom={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
                  animationTo={[
                    { filter: 'blur(5px)', opacity: 0.5, y: -5 },
                    { filter: 'blur(0px)', opacity: 1, y: 0 },
                  ]}
                />
              </h2>
              <FadeIn delay={0.2} distance={15}>
                <p className='text-lg font-light text-xyz-gray-6'>
                  {t('marketing.tools.subtitle')}
                </p>
              </FadeIn>
            </FadeIn>
            <StaggerIn
              staggerDelay={0.1}
              direction='up'
              distance={30}
              className='grid grid-cols-4 gap-0'
            >
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  className='border border-xyz-gray-3 p-5 flex flex-col gap-4 transition-all duration-300 hover:border-xyz-gray-5 hover:bg-xyz-gray-1'
                >
                  <div className='flex items-center gap-3'>
                    {toolLogos[tool.name]}
                    <h3 className='text-lg font-medium text-xyz-gray-10'>{tool.name}</h3>
                  </div>
                  <p className='text-sm font-light text-xyz-gray-6 leading-relaxed flex-1'>
                    {tool.description}
                  </p>
                  <code className='block text-xs font-code text-xyz-gray-7 bg-xyz-gray-1 px-3 py-2'>
                    {tool.config}
                  </code>
                </div>
              ))}
            </StaggerIn>
          </div>
        </div>
      </section>

      {/* ══════ Features (深色 DARK) ══════ */}
      <section className='bg-xyz-gray-10'>
        <div className='max-w-xyz mx-auto'>
          <div className='xyz-section-inner px-5 py-20'>
            <FadeIn>
              <h2 className='text-5xl font-medium leading-[56px] text-white mb-4'>
                <BlurText
                  text={t('marketing.features.title')}
                  delay={60}
                  animateBy='words'
                  direction='bottom'
                />
              </h2>
            </FadeIn>
            <div className='grid items-center gap-16 lg:grid-cols-2 mt-10'>
              <div className='feature-menu-list'>
                {[
                  { title: t('marketing.features.direct_title'), desc: t('marketing.features.direct_desc'), delay: 0.1 },
                  { title: t('marketing.features.compatible_title'), desc: t('marketing.features.compatible_desc'), delay: 0.2 },
                  { title: t('marketing.features.secure_title'), desc: t('marketing.features.secure_desc'), delay: 0.3 },
                ].map((item, idx) => {
                  const isActive = activeFeature === idx;
                  return (
                    <FadeIn key={idx} delay={item.delay} direction='left' distance={30}>
                      <div
                        onMouseEnter={() => setActiveFeature(idx)}
                        className={`feature-menu-item${isActive ? ' active' : ''} w-full text-left py-5 pl-4 pr-4 cursor-pointer hover:bg-white/[0.03]`}
                      >
                        <h3
                          className='text-xl font-medium mb-2'
                          style={{
                            color: isActive ? '#ffffff' : 'rgba(255,255,255,0.40)',
                            transition: 'color 0.3s ease',
                          }}
                        >
                          {item.title}
                        </h3>
                        <p
                          className='text-sm font-light leading-relaxed'
                          style={{
                            color: isActive ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.30)',
                            maxHeight: isActive ? '100px' : '0',
                            opacity: isActive ? 1 : 0,
                            overflow: 'hidden',
                            transition: 'color 0.3s ease, opacity 0.3s ease, max-height 0.4s ease',
                          }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
              <FadeIn direction='right' distance={50} delay={0.2}>
                <div className='w-full h-[480px]'>
                  <SvgParticleMorph
                    svgPaths={featureParticleShapes}
                    activeIndex={activeFeature}
                    particleCount={4000}
                    color='#ffffff'
                    size={1.2}
                    jitter={0.12}
                    morphDuration={1000}
                  />
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ CTA Section (深色 DARK + PixelCard hover) ══════ */}
      <section className='bg-xyz-gray-10'>
        <div className='max-w-xyz mx-auto'>
          <PixelCard
            gap={6}
            speed={40}
            colors='#4362ff,#6b89ff,#1d2cb3,#0f188c'
            noFocus
            className='xyz-section-inner px-5 py-20 text-center'
          >
            <div className='relative z-10'>
              <FadeIn>
                <h2 className='text-5xl font-medium leading-[56px] text-white mb-4'>
                  <BlurText
                    text={t('marketing.cta.title')}
                    delay={60}
                    animateBy='words'
                    direction='bottom'
                    className='justify-center'
                  />
                </h2>
              </FadeIn>
              <FadeIn delay={0.2} distance={15}>
                <p className='text-lg font-light text-xyz-white-6 max-w-lg mx-auto mb-10'>
                  {t('marketing.cta.description')}
                </p>
              </FadeIn>
              <FadeIn delay={0.4} distance={20}>
                <div className='flex justify-center gap-4'>
                  <Link
                    to='/register'
                    className='inline-flex items-center justify-center gap-2 bg-white text-xyz-blue-6 text-base font-light h-10 px-6 no-underline transition-colors hover:bg-xyz-gray-1'
                  >
                    {t('marketing.cta.register')}
                    <svg width='14' height='12' viewBox='0 0 14 12' fill='none' className='rotate-[-45deg]'>
                      <path d='M1 6H13M13 6L8 1M13 6L8 11' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                    </svg>
                  </Link>
                  <Link
                    to='/docs'
                    className='inline-flex items-center justify-center gap-2 border border-xyz-white-3 text-white text-base font-light h-10 px-6 no-underline transition-colors hover:border-xyz-white-5'
                  >
                    {t('marketing.cta.view_docs')}
                  </Link>
                </div>
              </FadeIn>
            </div>
          </PixelCard>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
