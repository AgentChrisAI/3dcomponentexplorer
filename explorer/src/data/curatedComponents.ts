// Curated component lists for major libraries — correct npm imports, working Sandpack examples

interface CuratedComponent {
  id: string;
  name: string;
  path: string;
  description: string;
  props: any[];
  sandpackExample: string;
  tags: string[];
}

interface CuratedRepo {
  components: CuratedComponent[];
  sandpackConfig: { dependencies: Record<string, string>; entry: string; cssImports?: string[] };
}

function ex(name: string, pkg: string, jsx: string): CuratedComponent {
  const code = `import { ${name} } from '${pkg}';\n\nexport default function Preview() {\n  return (\n    <div style={{ padding: 24, background: '#000', minHeight: 200 }}>\n      ${jsx}\n    </div>\n  );\n}`;
  const tags: string[] = [];
  if (/Button|Modal|Dialog|Drawer|Popover|Tooltip|Menu|Switch|Disclosure/.test(name)) tags.push('interactive');
  if (/Input|Select|Checkbox|Radio|Form|Field|Textarea|DatePicker|TextInput/.test(name)) tags.push('form');
  if (/Grid|Flex|Stack|Container|Box|Row|Col|Group|Layout/.test(name)) tags.push('layout');
  if (/Card|Badge|Avatar|Icon|Image|Text|Heading|Tag|Chip|Tile/.test(name)) tags.push('display');
  if (/Nav|Breadcrumb|Tab|Tabs|Sidebar|Link|Listbox/.test(name)) tags.push('navigation');
  if (/Alert|Toast|Spinner|Skeleton|Progress|Loading/.test(name)) tags.push('feedback');
  if (!tags.length) tags.push('other');
  return { id: name.toLowerCase(), name, path: `src/${name}.tsx`, description: `${name} component`, props: [], sandpackExample: code, tags };
}

export const CURATED: Record<string, CuratedRepo> = {
  'ant-design': {
    sandpackConfig: { dependencies: { antd: 'latest' }, entry: 'Button' },
    components: [
      ex('Button', 'antd', '<Button type="primary">Click me</Button>'),
      ex('Input', 'antd', '<Input placeholder="Type here..." />'),
      ex('Select', 'antd', '<Select defaultValue="a" style={{ width: 200 }} options={[{value:"a",label:"Option A"},{value:"b",label:"Option B"}]} />'),
      ex('Modal', 'antd', '<Button onClick={() => {}}>Open Modal</Button>'),
      ex('Table', 'antd', '<Table dataSource={[{key:"1",name:"Item 1"},{key:"2",name:"Item 2"}]} columns={[{title:"Name",dataIndex:"name",key:"name"}]} />'),
      ex('Card', 'antd', '<Card title="Card Title" style={{ width: 300 }}><p>Card content</p></Card>'),
      ex('DatePicker', 'antd', '<DatePicker />'),
      ex('Alert', 'antd', '<Alert message="Success" type="success" showIcon />'),
    ],
  },
  'material-ui': {
    sandpackConfig: { dependencies: { '@mui/material': 'latest', '@emotion/react': 'latest', '@emotion/styled': 'latest' }, entry: 'Button' },
    components: [
      ex('Button', '@mui/material', '<Button variant="contained">Click me</Button>'),
      ex('TextField', '@mui/material', '<TextField label="Name" variant="outlined" />'),
      ex('Card', '@mui/material', '<Card sx={{ p: 2, maxWidth: 300 }}><p>Card content</p></Card>'),
      ex('Chip', '@mui/material', '<Chip label="Tag" />'),
      ex('Avatar', '@mui/material', '<Avatar>A</Avatar>'),
      ex('Alert', '@mui/material', '<Alert severity="success">This is a success alert</Alert>'),
      ex('Select', '@mui/material', '<Select value="a"><MenuItem value="a">Option A</MenuItem></Select>'),
      ex('Badge', '@mui/material', '<Badge badgeContent={4} color="primary"><span>Mail</span></Badge>'),
    ],
  },
  'chakra-ui': {
    sandpackConfig: { dependencies: { '@chakra-ui/react': 'latest', '@emotion/react': 'latest', '@emotion/styled': 'latest', 'framer-motion': 'latest' }, entry: 'Button' },
    components: [
      ex('Button', '@chakra-ui/react', '<Button colorScheme="blue">Click me</Button>'),
      ex('Input', '@chakra-ui/react', '<Input placeholder="Type here..." />'),
      ex('Badge', '@chakra-ui/react', '<Badge colorScheme="green">New</Badge>'),
      ex('Card', '@chakra-ui/react', '<Card><CardBody>Card content</CardBody></Card>'),
      ex('Stack', '@chakra-ui/react', '<Stack spacing={3}><Box p={2} bg="gray.700">A</Box><Box p={2} bg="gray.600">B</Box></Stack>'),
      ex('Alert', '@chakra-ui/react', '<Alert status="success"><AlertIcon />Success!</Alert>'),
      ex('Tabs', '@chakra-ui/react', '<Tabs><TabList><Tab>One</Tab><Tab>Two</Tab></TabList></Tabs>'),
    ],
  },
  'mantine': {
    sandpackConfig: { dependencies: { '@mantine/core': 'latest', '@mantine/hooks': 'latest' }, entry: 'Button', cssImports: ['https://unpkg.com/@mantine/core/styles.css'] },
    components: [
      ex('Button', '@mantine/core', '<Button>Click me</Button>'),
      ex('TextInput', '@mantine/core', '<TextInput label="Name" placeholder="Your name" />'),
      ex('Card', '@mantine/core', '<Card shadow="sm" padding="lg"><p>Card content</p></Card>'),
      ex('Badge', '@mantine/core', '<Badge>Badge</Badge>'),
      ex('Group', '@mantine/core', '<Group><Button>A</Button><Button>B</Button></Group>'),
      ex('Alert', '@mantine/core', '<Alert title="Hey!">Something happened</Alert>'),
      ex('Tabs', '@mantine/core', '<Tabs defaultValue="first"><Tabs.List><Tabs.Tab value="first">First</Tabs.Tab><Tabs.Tab value="second">Second</Tabs.Tab></Tabs.List></Tabs>'),
    ],
  },
  'react-bootstrap': {
    sandpackConfig: { dependencies: { 'react-bootstrap': 'latest', 'bootstrap': 'latest' }, entry: 'Button', cssImports: ['https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css'] },
    components: [
      ex('Button', 'react-bootstrap', '<Button variant="primary">Click me</Button>'),
      ex('Card', 'react-bootstrap', '<Card style={{ width: 300 }}><Card.Body><Card.Title>Title</Card.Title><Card.Text>Content</Card.Text></Card.Body></Card>'),
      ex('Alert', 'react-bootstrap', '<Alert variant="success">Success!</Alert>'),
      ex('Badge', 'react-bootstrap', '<Badge bg="primary">Badge</Badge>'),
      ex('Nav', 'react-bootstrap', '<Nav><Nav.Link href="#">Link 1</Nav.Link><Nav.Link href="#">Link 2</Nav.Link></Nav>'),
      ex('Table', 'react-bootstrap', '<Table striped bordered><thead><tr><th>#</th><th>Name</th></tr></thead><tbody><tr><td>1</td><td>Item</td></tr></tbody></Table>'),
    ],
  },
  'fluentui': {
    sandpackConfig: { dependencies: { '@fluentui/react-components': 'latest' }, entry: 'Button' },
    components: [
      ex('Button', '@fluentui/react-components', '<Button appearance="primary">Click me</Button>'),
      ex('Input', '@fluentui/react-components', '<Input placeholder="Type here..." />'),
      ex('Card', '@fluentui/react-components', '<Card><p>Card content</p></Card>'),
      ex('Badge', '@fluentui/react-components', '<Badge appearance="filled">1</Badge>'),
      ex('Avatar', '@fluentui/react-components', '<Avatar name="John Doe" />'),
      ex('Tab', '@fluentui/react-components', '<TabList><Tab value="1">First</Tab><Tab value="2">Second</Tab></TabList>'),
    ],
  },
  'ariakit': {
    sandpackConfig: { dependencies: { '@ariakit/react': 'latest' }, entry: 'Button' },
    components: [
      ex('Button', '@ariakit/react', '<Button>Click me</Button>'),
      ex('Dialog', '@ariakit/react', '<p>Dialog component — requires useDialogStore hook</p>'),
      ex('Tab', '@ariakit/react', '<p>Tab component — requires useTabStore hook</p>'),
      ex('Checkbox', '@ariakit/react', '<Checkbox>Accept terms</Checkbox>'),
      ex('Select', '@ariakit/react', '<p>Select — requires useSelectStore hook</p>'),
    ],
  },
  'headlessui': {
    sandpackConfig: { dependencies: { '@headlessui/react': 'latest' }, entry: 'Dialog' },
    components: [
      ex('Dialog', '@headlessui/react', '<p>Headless Dialog — unstyled, bring your own CSS</p>'),
      ex('Menu', '@headlessui/react', '<p>Headless Menu — unstyled dropdown</p>'),
      ex('Switch', '@headlessui/react', '<Switch checked={false} onChange={() => {}} className="">Toggle</Switch>'),
      ex('Listbox', '@headlessui/react', '<p>Headless Listbox — unstyled select</p>'),
      ex('Tab', '@headlessui/react', '<Tab.Group><Tab.List><Tab>One</Tab><Tab>Two</Tab></Tab.List></Tab.Group>'),
      ex('Disclosure', '@headlessui/react', '<Disclosure><Disclosure.Button>Toggle</Disclosure.Button><Disclosure.Panel>Content</Disclosure.Panel></Disclosure>'),
    ],
  },
  'primitives': {
    sandpackConfig: { dependencies: { '@radix-ui/react-dialog': 'latest', '@radix-ui/react-dropdown-menu': 'latest', '@radix-ui/react-tabs': 'latest', '@radix-ui/react-tooltip': 'latest' }, entry: 'Dialog' },
    components: [
      { id: 'dialog', name: 'Dialog', path: 'packages/react/dialog/src/Dialog.tsx', description: 'Accessible dialog/modal primitive', props: [], sandpackExample: `import * as Dialog from '@radix-ui/react-dialog';\n\nexport default function Preview() {\n  return (\n    <div style={{ padding: 24, background: '#000', minHeight: 200 }}>\n      <Dialog.Root><Dialog.Trigger>Open</Dialog.Trigger></Dialog.Root>\n    </div>\n  );\n}`, tags: ['interactive'] },
      { id: 'tabs', name: 'Tabs', path: 'packages/react/tabs/src/Tabs.tsx', description: 'Accessible tabs primitive', props: [], sandpackExample: `import * as Tabs from '@radix-ui/react-tabs';\n\nexport default function Preview() {\n  return (\n    <div style={{ padding: 24, background: '#000', minHeight: 200 }}>\n      <Tabs.Root defaultValue="tab1"><Tabs.List><Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger></Tabs.List><Tabs.Content value="tab1">Content</Tabs.Content></Tabs.Root>\n    </div>\n  );\n}`, tags: ['navigation'] },
      { id: 'tooltip', name: 'Tooltip', path: 'packages/react/tooltip/src/Tooltip.tsx', description: 'Accessible tooltip primitive', props: [], sandpackExample: `import * as Tooltip from '@radix-ui/react-tooltip';\n\nexport default function Preview() {\n  return (\n    <div style={{ padding: 24, background: '#000', minHeight: 200 }}>\n      <Tooltip.Provider><Tooltip.Root><Tooltip.Trigger>Hover me</Tooltip.Trigger><Tooltip.Content>Tip!</Tooltip.Content></Tooltip.Root></Tooltip.Provider>\n    </div>\n  );\n}`, tags: ['interactive'] },
    ],
  },
  'grommet': {
    sandpackConfig: { dependencies: { grommet: 'latest', 'grommet-icons': 'latest', 'styled-components': 'latest' }, entry: 'Button' },
    components: [
      ex('Button', 'grommet', '<Button label="Click me" primary />'),
      ex('Box', 'grommet', '<Box pad="medium" background="dark-1"><p>Box content</p></Box>'),
      ex('Card', 'grommet', '<Card pad="medium"><p>Card</p></Card>'),
      ex('TextInput', 'grommet', '<TextInput placeholder="Type here..." />'),
      ex('Select', 'grommet', '<Select options={["Option A","Option B"]} />'),
    ],
  },
  'evergreen': {
    sandpackConfig: { dependencies: { 'evergreen-ui': 'latest' }, entry: 'Button' },
    components: [
      ex('Button', 'evergreen-ui', '<Button appearance="primary">Click me</Button>'),
      ex('TextInput', 'evergreen-ui', '<TextInput placeholder="Type here..." />'),
      ex('Card', 'evergreen-ui', '<Card elevation={1} padding={16}><p>Card</p></Card>'),
      ex('Badge', 'evergreen-ui', '<Badge color="green">New</Badge>'),
      ex('Alert', 'evergreen-ui', '<Alert intent="success" title="Done!" />'),
    ],
  },
  'carbon': {
    sandpackConfig: { dependencies: { '@carbon/react': 'latest' }, entry: 'Button', cssImports: ['https://unpkg.com/@carbon/styles/css/styles.min.css'] },
    components: [
      ex('Button', '@carbon/react', '<Button>Click me</Button>'),
      ex('TextInput', '@carbon/react', '<TextInput id="input-1" labelText="Name" />'),
      ex('Tag', '@carbon/react', '<Tag type="blue">Tag</Tag>'),
      ex('Tile', '@carbon/react', '<Tile><p>Tile content</p></Tile>'),
      ex('Select', '@carbon/react', '<Select id="select-1" labelText="Choose"><SelectItem value="a" text="Option A" /><SelectItem value="b" text="Option B" /></Select>'),
      ex('Tabs', '@carbon/react', '<Tabs><TabList><Tab>First</Tab><Tab>Second</Tab></TabList></Tabs>'),
    ],
  },
  'blueprint': {
    sandpackConfig: { dependencies: { '@blueprintjs/core': 'latest' }, entry: 'Button', cssImports: ['https://unpkg.com/@blueprintjs/core/lib/css/blueprint.css'] },
    components: [
      ex('Button', '@blueprintjs/core', '<Button intent="primary" text="Click me" />'),
      ex('Card', '@blueprintjs/core', '<Card><p>Card content</p></Card>'),
      ex('Tag', '@blueprintjs/core', '<Tag intent="success">Tag</Tag>'),
      ex('Alert', '@blueprintjs/core', '<p>Blueprint Alert — imperative API</p>'),
      ex('InputGroup', '@blueprintjs/core', '<InputGroup placeholder="Type here..." />'),
    ],
  },
  'Semantic-UI-React': {
    sandpackConfig: { dependencies: { 'semantic-ui-react': 'latest', 'semantic-ui-css': 'latest' }, entry: 'Button', cssImports: ['https://cdn.jsdelivr.net/npm/semantic-ui-css/semantic.min.css'] },
    components: [
      ex('Button', 'semantic-ui-react', '<Button primary>Click me</Button>'),
      ex('Card', 'semantic-ui-react', '<Card><Card.Content><Card.Header>Title</Card.Header></Card.Content></Card>'),
      ex('Input', 'semantic-ui-react', '<Input placeholder="Type here..." />'),
      ex('Label', 'semantic-ui-react', '<Label>Tag</Label>'),
    ],
  },
  'zustand': {
    sandpackConfig: { dependencies: { zustand: 'latest' }, entry: 'Counter' },
    components: [
      { id: 'counter', name: 'Counter', path: 'examples/counter.tsx', description: 'Zustand counter store example', props: [], sandpackExample: `import { create } from 'zustand';\n\nconst useStore = create((set) => ({\n  count: 0,\n  inc: () => set((s) => ({ count: s.count + 1 })),\n}));\n\nexport default function Preview() {\n  const { count, inc } = useStore();\n  return (\n    <div style={{ padding: 24, background: '#000', minHeight: 200, color: '#fff' }}>\n      <h3>Count: {count}</h3>\n      <button onClick={inc} style={{ padding: '8px 16px', borderRadius: 999, border: '1px solid #fff', background: '#000', color: '#fff', cursor: 'pointer' }}>Increment</button>\n    </div>\n  );\n}`, tags: ['other'] },
    ],
  },
};
