import type { ReactElement } from "react";

export default function AboutPage(): ReactElement {
  return (
    <section className="about-page">
      <header className="page-intro">
        <span className="section-kicker">ABOUT THE ARCHIVE</span>
        <h2>关于小六壬档案</h2>
        <p>这是一个完全在浏览器本地运行的结构化知识与传统报时起课工具。</p>
      </header>
      <div className="about-grid">
        <article className="result-section"><h3>本地优先</h3><p>计算、知识选择、伦理过滤和 JSON 导出都在本地完成，不上传问题原文，也不调用生成式 AI 断语服务。</p></article>
        <article className="result-section"><h3>传统与现代分区</h3><p>固定算法只接收农历月、日和时辰。原典、现代释义、来源状态和现实边界分别保留，避免把象意写成确定预言。</p></article>
        <article className="result-section"><h3>现实边界优先</h3><p>明确拒绝、第三方隐私、医疗急症和现实危险由结构化伦理规则优先处理；伦理规则不能改变最终落宫。</p></article>
      </div>
    </section>
  );
}
