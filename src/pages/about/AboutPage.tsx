import type { ReactElement } from "react";
import { getKnowledgeVersion } from "../../knowledge";
import { APP_VERSION_INFO } from "../../app/app-version";

export default function AboutPage(): ReactElement {
  const knowledgeVersion = getKnowledgeVersion();
  return (
    <section className="about-page">
      <header className="page-intro">
        <span className="section-kicker">ABOUT THE ARCHIVE</span>
        <h2>关于小六壬档案</h2>
        <p>这是一个本地优先运行的结构化知识与传统报时起课工具。</p>
      </header>
      <section className="result-section about-build" aria-labelledby="about-build-heading">
        <div className="section-heading">
          <span className="section-kicker">BETA BUILD</span>
          <h3 id="about-build-heading">测试版信息</h3>
        </div>
        <dl className="provenance-grid">
          <dt>应用版本</dt><dd id="about-app-version">{APP_VERSION_INFO.version}</dd>
          <dt>构建渠道</dt><dd id="about-build-channel">{APP_VERSION_INFO.buildChannel}</dd>
          <dt>算法版本</dt><dd id="about-algorithm-version">{APP_VERSION_INFO.algorithmVersion}</dd>
          <dt>知识版本</dt><dd id="about-knowledge-version">{knowledgeVersion}</dd>
        </dl>
        <p className="privacy-note">本地优先：排盘、知识、伦理过滤和导出在设备本地完成；不上传问题原文，不接入生成式 AI、遥测或云同步。</p>
      </section>
      <div className="about-grid">
        <article className="result-section"><h3>本地优先</h3><p>计算、知识选择、伦理过滤和 JSON 导出都在本地完成，不上传问题原文，也不调用生成式 AI 断语服务。</p></article>
        <article className="result-section"><h3>传统与现代分区</h3><p>固定算法只接收农历月、日和时辰。原典、现代释义、来源状态和现实边界分别保留，避免把象意写成确定预言。</p></article>
        <article className="result-section"><h3>现实边界优先</h3><p>明确拒绝、第三方隐私、医疗急症和现实危险由结构化伦理规则优先处理；伦理规则不能改变最终落宫。</p></article>
      </div>
    </section>
  );
}
